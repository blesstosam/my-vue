const path = require('path')
const webpack = require('webpack')
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
const { VueLoaderPlugin } = require('vue-loader')
// css样式提取单独文件
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const isProd = process.env.NODE_ENV === 'production'

module.exports = {
  mode: process.env.NODE_ENV || 'development',
  devtool: isProd
    ? false
    : '#cheap-module-source-map',
  output: {
    path: path.resolve(__dirname, '../dist'),
    publicPath: '/dist/',
    filename: '[name].[chunkhash].js'
  },
  module: {
    noParse: /es6-promise\.js$/, // avoid webpack shimming process
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          compilerOptions: {
            preserveWhitespace: false
          }
        }
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        loader: 'url-loader',
        options: {
          limit: 10000,
          name: '[name].[ext]?[hash]'
        }
      },
      {
        test: /\.styl(us)?$/,
        // 利用mini-css-extract-plugin提取css, 开发环境也不是必须
        // use: [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader']
        // 开发环境不需要提取css单独文件
        use: isProd
          ? [MiniCssExtractPlugin.loader, 'css-loader', 'stylus-loader']
          : ['vue-style-loader', 'css-loader', 'stylus-loader']
      },
    ]
  },
  performance: {
    hints: false
  },
  plugins: isProd
    ? [
      new VueLoaderPlugin(),
      new webpack.optimize.ModuleConcatenationPlugin(),
      // webpack4.0版本以上采用MiniCssExtractPlugin 而不使用extract-text-webpack-plugin
      new MiniCssExtractPlugin({
        filename: 'static/css/[name].[contenthash].css',
        chunkFilename: 'static/css/[name].[contenthash].css'
      }),
    ]
    : [
      new VueLoaderPlugin(),
      new FriendlyErrorsPlugin()
    ]
}
