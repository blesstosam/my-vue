const path = require('path');
const merge = require('webpack-merge')
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const base = require('./webpack.client.config')

module.exports = merge(base, {
  entry: './entry-client.js',
	output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js'
  },
  mode: 'development',
  module: {
    rules: [
      { test: /\.vue$/, use: 'vue-loader' }
    ]
  },
  plugins: [
		new VueLoaderPlugin()
	]
})
