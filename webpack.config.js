const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
    mode: 'development',
    devtool: false, //'source-map',

    entry: './docs/js/playground.js',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'js/playground.bundle.js',
        libraryTarget: "window",
        library: "Playground"
    },
    resolve: {
        modules: [path.resolve(__dirname, "dist"), "node_modules"]
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules|bower_components)/,
            use: 'babel-loader'
        }]
    },
    plugins: [
        new CopyPlugin([
            { from: 'src/css', to: 'css' },
            { from: 'src/js', to: 'js' }
        ])
    ],
    stats: {
        colors: true
    }
}, {
    mode: 'production',
    devtool: false,

    context: path.resolve(__dirname, "dist"),
    entry: './index.js',
    output: {
        filename: 'latex.min.js',
        libraryTarget: "umd",
        library: "latexjs",
        umdNamedDefine: true
    },
    module: {
        rules: [{
            test: /\.js$/,
            exclude: /(node_modules)/,
            use: 'babel-loader'
        }]
    },
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    },
    stats: {
        colors: true
    }
}];
