// app.js
const Vue = require('vue')
const createRouter = require('./router')

module.exports = function createApp (context) {
  // 创建 router 实例
  const router = createRouter()

  const app = new Vue({
    // 注入 router 到根 Vue 实例
    router,
    data: {
      url: context.url
    },
    template: `<div>访问的 URL 是： {{ url }}</div>`
  })

  return {app, router}
}