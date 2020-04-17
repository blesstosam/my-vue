const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

// vue server renderer
const renderer = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync('temp.html', 'utf-8')
})

const server = new Koa();
const router = new Router()

server.use(router.routes()).use(router.allowedMethods());

const createApp = require('./app')

// 其他路由匹配规则要放到前面 否则不起作用
// 但是如果这里的路由有和vue-router定义的一样的 则会覆盖vue-router里的路由
router.get('/', (ctx, next) => {
  ctx.body = { ok: true }
})

// router.get('/_static/', async (ctx, next) => {
//   await send(ctx, 'ssr/app.js')
// })

// app.use(async (ctx) => {
//   await send(ctx, ctx.path, { root: __dirname + '/static' });
// })

// 这里使用koa-router匹配所有的路由 所以其他路由匹配规则要放到前面 否则不起作用
// 如果匹配到了vue-router里定义的路由 通过renderer来渲染
// 如果没有匹配到返回404页面 如果该路由在其他地方通过koa-router匹配则不会返回404
router.get('*', async (ctx, next) => {
  // 每次请求都会创建一个新的vue实例 并将koa的ctx传递给vue实例
  const context = { url: ctx.req.url, ...ctx }

  // 匹配静态文件
  if (ctx.req.url.indexOf('static/') !== -1) {
    await send(ctx, 'ssr/static/' + '1.html')
    return;
  }

  // 需要和vue-router配合 当匹配到vue-router定义的路由时才会渲染
  matchVueRouter(context).then(app => {
    // 渲染html页面
    renderer.renderToString(app, { title: 'hello sam' }, (err, html) => {
      console.log(html, '111')
      if (err) {
        ctx.status = 500
        ctx.body = 'Internal Server Error'
        return
      }
      ctx.body = html
    })
  }, async err => {
    // todo 为什么这里的err会执行两次
    console.log('matchVueRouter in 22222: ', err, err.code === 404)
    if (err.code === 404) {
      ctx.status = 404
      ctx.body = 'you are nowhere!'
    }
  })
  // 注意 catch里的ctx.body 不起作用
  // .catch(err => {
  //   console.log('matchVueRouter: ', err, err.code === 404)
  //   // if (err.code === 404) {
  //     ctx.status = 500
  //     ctx.body = 'you are nowhere!'
  //   // }
  // })
})

function matchVueRouter(context) {
  return new Promise((reslove, reject) => {
    const { app, router } = createApp(context)

    // 设置服务器端 router 的位置
    router.push(context.url)

    // 等到 router 将可能的异步组件和钩子函数解析完
    router.onReady(() => {
      const matchedComponents = router.getMatchedComponents()
      // 匹配不到的路由 执行 reject 函数，并返回 404
      if (!matchedComponents.length) {
        return reject({ code: 404 })
      }

      // Promise 应该 resolve 应用程序实例，以便它可以渲染
      reslove(app)
    }, reject)
  })

}

server.listen(8080, () => { console.log('server listening in port 8080') })









