const webpack = require('webpack')
const path = require('path');
const merge = require('webpack-merge')

const base = require('./webpack.base.config')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')

module.exports = merge(base, {
  entry: {
    app: './entry-client.js'
  },
  plugins: [
    // 重要信息：这将 webpack 运行时分离到一个引导 chunk 中，
    // 以便可以在之后正确注入异步 chunk。
    // 这也为你的 应用程序/vendor 代码提供了更好的缓存。
    // new webpack.optimize.CommonsChunkPlugin({
    //   name: "manifest",
    //   minChunks: Infinity
    // }),
    // CommonsChunkPlugin 已被废弃 新的写法 参考下面 splitChunks

    // strip dev-only code in Vue source
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      'process.env.VUE_ENV': '"client"'
    }),

    // 此插件在输出目录中
    // 生成 `vue-ssr-client-manifest.json`。
    new VueSSRClientPlugin(),
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        commons: {
          name: "manifest",
          // chunks: "initial",
          minChunks: Infinity
        }
      }
    },
    // minimizer: [
      // https://www.jianshu.com/p/ceaf950a027b
      // add UglifyJsPlugin
    // ]
  }

})
