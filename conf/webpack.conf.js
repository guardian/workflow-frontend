/* global module:false, __dirname:false */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ManifestPlugin = require('webpack-manifest-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
    mode:'development',
    optimization: {
        minimize: false
    },
    entry: {
        app: './public/app.js',
        sw: './public/sw.js',
        admin: './public/admin.js'
    },
    output: {
        filename: '[name].bundle.js',
        path: path.join(__dirname, '..', 'public', 'build'),
    },
    devtool: 'source-map',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                resolve: {
                    extensions: ['.js', '.jsx']
                },
                exclude: /node_modules/,
                use: { loader: 'babel-loader' }
            },
            {
                test: /\.tsx?$/,
                use: 'ts-loader?transpileOnly=true',
                exclude: /node_modules/
            },
            {
              test: /\.(html|svg)$/,
              exclude: '/app/',
              loader: 'html-loader'
            },
            {
                test: /.s?css$/,
                resolve: {
                    extensions: ['scss', 'css']
                },
                use: [MiniCssExtractPlugin.loader, { loader: 'css-loader', options: { sourceMap: true } }, {
                    loader: 'sass-loader', options: {
                        sourceMap: true,
                    }
                }],
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
        extensions: ['.js', '.jsx', '.json', '.scss', '.css', '.ts', '.tsx'],
        alias: {
            lib: path.join(__dirname, '..', 'public', 'lib'),
            components: path.join(__dirname, '..', 'public', 'components'),
            layouts: path.join(__dirname, '..', 'public', 'layouts'),
        }
    },

    plugins: [
        new MiniCssExtractPlugin(),
        new ManifestPlugin(),
        new ForkTsCheckerWebpackPlugin({
            compilerOptions: {
                noEmit: true
            }
        })
    ]
};
