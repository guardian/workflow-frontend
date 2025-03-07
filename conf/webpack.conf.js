/* global module:false, __dirname:false */

const path = require('path');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const {WebpackManifestPlugin} = require("webpack-manifest-plugin");

module.exports = {
    mode:'development',
    optimization: {
        minimize: false
    },
    entry: {
        app: './public/app.js',
        admin: './public/admin.js',
        search: './public/search.ts'
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
                use: [
                    {
                        loader: "url-loader",
                        options: {
                            limit: 10000,
                            mimetype: "application/font-woff"
                        }
                    }
                ]
            },
            {
                test: /\.(ttf|eot|gif|png|svg)(\?v=[0-9].[0-9].[0-9])?$/,
                exclude: /icons\.svg$/,
                use: [
                    {
                        loader: "file-loader",
                        options: {
                            name: '[name].[ext]'
                        }
                    }
                ]
            }
        ]
    },

    resolve: {
        extensions: ['.js', '.jsx', '.json', '.scss', '.css', '.ts', '.tsx'],
        alias: {
            lib: path.join(__dirname, '..', 'public', 'lib'),
            components: path.join(__dirname, '..', 'public', 'components'),
            layouts: path.join(__dirname, '..', 'public', 'layouts'),
            react: path.resolve(path.join(__dirname, '..', './node_modules/react')),
            'react-dom': path.resolve(path.join(__dirname, '..','./node_modules/react-dom'))
        }
    },

    plugins: [
        new MiniCssExtractPlugin(),
        new WebpackManifestPlugin(),
        new ForkTsCheckerWebpackPlugin({
            typescript: {
                compilerOptions: {
                    noEmit: true
                }
            }
        })
    ]
};
