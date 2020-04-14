// server.js
// const createApp = require('/dist/server-bundle.js')
const { createBundleRenderer } = require('vue-server-renderer')
const setupDevServer = require('./build/setup-dev-server')
const path = require('path')

const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

// 创建渲染器
function createRenderer (bundle, options) {
  // https://github.com/vuejs/vue/blob/dev/packages/vue-server-renderer/README.md#why-use-bundlerenderer
  return createBundleRenderer(bundle, Object.assign(options, {
    // for component caching
    // cache: LRU({
    //   max: 1000,
    //   maxAge: 1000 * 60 * 15
    // }),
    // this is only needed when vue-server-renderer is npm-linked
    // basedir: resolve('./dist'),
    // recommended for performance
    runInNewContext: false
  }))
}

// const bundle = require('./dist/server-bundle.json')
// const renderer = createRenderer(bundle, {
//   template: require('fs').readFileSync('ssr/temp.html', 'utf-8')
// })


const server = new Koa();
const router = new Router()

server.use(router.routes()).use(router.allowedMethods());


let renderer
const templatePath = path.resolve(__dirname, './temp.html')
const readyPromise = setupDevServer(server, templatePath, (bundle, opts) => {
	renderer = createRenderer(bundle, opts)
})

router.get('*', async (ctx, next) => {
	// ctx.body = '222'
	readyPromise.then(() => {
	  renderer.renderToString({title: 'blesstosam'}, (err, html) => {
	    if (err) {
	    	ctx.status = 500
	    	ctx.body = "Internal server error"
	      return
	    }
	    console.log(html, 'html')
	    ctx.body = html
	  })

	})
})




