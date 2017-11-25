var path = require('path');
var webpack = require('webpack');

module.exports = {
    entry: './dist/latex-parser.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'latex-parser.bundle.js',
        libraryTarget: "var",
        library: "latexjs"
    },
    module: {
        loaders: [
            {
                test: /\.js$/,
                loader: 'babel-loader',
            }
        ]
    },
    externals: {
        'domino': 'domino'
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};