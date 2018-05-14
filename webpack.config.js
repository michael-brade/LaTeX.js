const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    // mode: 'production',
    mode: 'development',
    devtool: false, //'source-map',

    context: __dirname,
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
};
