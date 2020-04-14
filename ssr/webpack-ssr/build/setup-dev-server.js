const webpack = require('webpack');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const chokidar = require('chokidar')
const fs = require('fs')
const MFS = require('memory-fs')
const clinetCfg = require('./webpack.client.config')
const serverCfg = require('./webpack.server.config')

const PassThrough = require('stream').PassThrough;

// 简单封装一下readfile
const readFile = (fs, file) => {
  try {
    return fs.readFileSync(path.join(path.resolve(__dirname, '../dist'), file), 'utf-8')
  } catch (e) {}
}


module.exports = function setupDevServer (koaApp, templatePath, cb) {
	let bundle
	let template
	// todo 这个是干嘛的 看webpack官方文档
	let clientManifest

	let ready
	const readyPromose = new Promise(r => { ready = r })
	const update = () => {
		console.log(bundle, clientManifest, 'in update++++++++++++++++++++')
		if (bundle && clientManifest) {
     	// ready() => reslove() 每次调用触发readyPromise.then里的回调
      ready()
      cb(bundle, {
        template,
        clientManifest
      })
		}
	}

	// 读取模板文件
	template = fs.readFileSync(templatePath, 'utf-8')

	// 模版文件webpack不能watch 所以需要单独watch
	chokidar.watch(templatePath).on('change', () => {
	  template = fs.readFileSync(templatePath, 'utf-8')
	  console.warn('html template updated.')
	  update()
	})

  // modify client config to work with hot middleware
  clinetCfg.entry.app = ['webpack-hot-middleware/client', clinetCfg.entry.app]
  clinetCfg.output.filename = '[name].js'
  clinetCfg.plugins.push(
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin()
  )

	// 之前放在webpack.config.js里的配置现在放到这里
	const clientCompiler = webpack(clinetCfg);
	// webpack-dev-middleware 用于处理静态文件
	// 使用 webpack-dev-middleware 的时候webpack会自动开启watch
	const devMiddleware = require('webpack-dev-middleware')(clientCompiler, {
	  // webpack-dev-middleware options
	  publicPath: '/dist/', // required
	})
	// 官方给的示例是express的，这里改成koa 因为后台框架选用koa
	// 开发服务器保持和生产一致
	// 参考自 https://www.cnblogs.com/liuyt/p/7217024.html
	koaApp.use(() => {
		return async (ctx, next) => {
	    await devMiddleware(ctx.req, {
	      end: (content) => {
	        ctx.body = content
	      },
	      setHeader: (name, value) => {
	        ctx.set(name, value)
	      }
	  	}, next)
		}
	});
	// https://cloud.tencent.com/developer/ask/151446
	clientCompiler.hooks.done.tap('aaa', stats => {
		console.log('-------------------done', devMiddleware.fileSystem)
	  // stats.errors.forEach(err => console.error(err))
	  // stats.warnings.forEach(err => console.warn(err))
	  if (stats.errors) return
	  console.log(readFile(
	    devMiddleware.fileSystem,
	    'client-manifest.json'
	  ), 222)
	// todo 怎么读区manifest.json 看nuxt 和webpack
	  clientManifest = JSON.parse(readFile(
	    devMiddleware.fileSystem,
	    'client-manifest.json'
	  ))
	  update()
	})

	// webpack-hot-middleware 插件用于热更新
	// 同样改成koa的版本
	koaApp.use(() => {
		const hmrPlugin = require('webpack-hot-middleware')(clientCompiler, { heartbeat: 5000 })
		return async (ctx, next) => {
	   let stream = new PassThrough()
	    ctx.body = stream
	    await hmrPlugin(ctx.req, {
	      write: stream.write.bind(stream),
	      writeHead: (status, headers) => {
	        ctx.status = status
	        ctx.set(headers)
	      }
	    }, next)
		}
	})


  const serverCompiler = webpack(serverCfg)
  const mfs = new MFS()
  serverCompiler.outputFileSystem = mfs
  serverCompiler.watch({}, (err, stats) => {
    if (err) throw err
    stats = stats.toJson()
    if (stats.errors.length) return

		// vue-server-renderer/server-plugin 会生成 vue-ssr-server-bundle.json 文件
    bundle = JSON.parse(readFile(mfs, 'vue-ssr-server-bundle.json'))
    update()
  })


	koaApp.listen(5000, () => { console.log('server listening in port 5000') })

	return readyPromose
}





