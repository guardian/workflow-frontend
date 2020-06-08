const webpack = require('webpack');
const Merge = require('webpack-merge');
const CommonConfig = require('./webpack.conf.js');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = function() {
  return Merge(CommonConfig, {
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin({
        terserOptions:{mangle:false}
      })],
    },
  })
}