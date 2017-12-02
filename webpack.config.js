var path = require('path');
var webpack = require('webpack');
var CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    context: __dirname,
    entry: './docs/js/playground.js',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'js/playground.bundle.js',
        libraryTarget: "window",
        library: "Playground"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader'
            }
        ]
    },
    resolve: {
        modules: [path.resolve(__dirname, "dist"), "node_modules"]
    },
    plugins: [
        new CopyPlugin([
            { from: 'src/css', to: 'css' },
            //{ from: 'src/fonts', to: 'fonts' }
        ])
    ],
    stats: {
        colors: true
    },
    //devtool: 'source-map'
};
