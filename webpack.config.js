var path = require('path');
var webpack = require('webpack');
var CopyPlugin = require('copy-webpack-plugin');

module.exports = {
};

module.exports = {
    entry: path.join(__dirname, 'dist/latex-parser.js'),
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'js/latex-parser.bundle.js',
        libraryTarget: "window",
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
    plugins: [
        new CopyPlugin([
            { from: 'src/css', to: 'css' },
            //{ from: 'src/fonts', to: 'fonts' }
        ])
    ],
    externals: {
        'domino': 'void 8'
    },
    stats: {
        colors: true
    },
    devtool: 'source-map'
};
