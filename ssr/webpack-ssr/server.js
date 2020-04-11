// server.js
const createApp = require('/dist/server-bundle.js')

const Koa = require('koa')
const Router = require('koa-router')
const send = require('koa-send')

// vue server renderer
const renderer = require('vue-server-renderer').createRenderer({
  template: require('fs').readFileSync('ssr/temp.html', 'utf-8')
})

server.use(router.routes()).use(router.allowedMethods());

const server = new Koa();
const router = new Router()

router.get('*', async (ctx, next) => {
  const context = { url: ctx.req.url, ...ctx }

  createApp(context).then(app => {
    renderer.renderToString(app, (err, html) => {
      if (err) {
        if (err.code === 404) {
        	ctx.status = 404
        	ctx.body="Page not found"Ï
        } else {
      		ctx.status = 500
        	ctx.body="Internal Server Error"Ï
        }
      } else {
        ctx.body = html
      }
    })
  })
})
