const webpack = require('webpack');
const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.conf.js');

module.exports = function() {
  return Merge(CommonConfig, {
    plugins: [
      new webpack.optimize.UglifyJsPlugin({
        mangle: false,
        comments: false
      })
    ]
  })
}