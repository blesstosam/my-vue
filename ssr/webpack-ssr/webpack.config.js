const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');

module.exports = {
  entry: './app.js',
	output: {
		path: path.resolve(__dirname, 'dist'),
    filename: 'client-bundle.js'
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
}
