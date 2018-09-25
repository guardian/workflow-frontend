/* global module:false, __dirname:false */

var path = require('path');
var webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = {
    entry: {
        app: './public/app.js',
        sw: './public/sw.js',
        admin: './public/admin.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, '..', 'public', 'build'),
    },
    module: {
        loaders: [
            {
                test:    /\.js$/,
                exclude: /node_modules/,
                loaders: ['babel-loader']
            },
            {
              test: /\.(html|svg)$/,
              exclude: '/app/',
              loader: 'html-loader'
            },
            {
              test: /\.json$/,
              exclude: /node_modules/,
              use: 'json-loader'
            },
            {
                test: /\.scss$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?sourceMap!sass-loader?sourceMap'
                })
            },
            {
                test: /\.css$/,
                loader: ExtractTextPlugin.extract({
                    fallback: 'style-loader',
                    use: 'css-loader?sourceMap'
                })
            },
            {
                test: /\.woff(2)?(\?v=[0-9].[0-9].[0-9])?$/,
                loader: "url-loader?mimetype=application/font-woff&limit=10000"
            },
            {
                test: /\.(ttf|eot|gif|png|svg)(\?v=[0-9].[0-9].[0-9])?$/,
                exclude: /icons\.svg$/,
                loader: "file-loader?name=[name].[ext]"
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json', '.scss', '.css'],
        alias: {
            lib: path.join(__dirname, '..', 'public', 'lib'),
            components: path.join(__dirname, '..', 'public', 'components'),
            layouts: path.join(__dirname, '..', 'public', 'layouts'),
        }
    },

    plugins: [
        new ExtractTextPlugin('main.css')
    ]
};

