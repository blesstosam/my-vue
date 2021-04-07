// router.js
const Vue = require('vue')
const Router = require('vue-router')

Vue.use(Router)

module.exports = function createRouter () {
  return new Router({
    mode: 'history',
    routes: [
      {path: '/admin'},
    ]
  })
}