const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = [{
    name: 'playground',
    mode: 'production',
    devtool: 'source-map',

    entry: './docs/js/playground.js',
    output: {
        path: path.resolve(__dirname, 'docs'),
        filename: 'js/playground.bundle.min.js',
        libraryTarget: 'window',
        library: 'Playground'
    },
    resolve: {
        modules: [path.resolve(__dirname, "dist"), "node_modules"]
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'source-map-loader',
                enforce: 'pre'
            },
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    },
    plugins: [
        new CopyPlugin([
            { from: 'src/css', to: 'css' },
            { from: 'src/js', to: 'js' }
        ])
    ],
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
}, {
    name: 'latex.js',
    mode: 'production',
    devtool: 'source-map',

    context: path.resolve(__dirname, 'dist'),
    entry: './index.js',
    output: {
        filename: 'latex.min.js',
        libraryTarget: "umd",
        library: "latexjs",
        umdNamedDefine: true
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'source-map-loader',
                enforce: 'pre'
            },
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: 'babel-loader'
            }
        ]
    },
    performance: {
        maxEntrypointSize: 600000,
        maxAssetSize: 600000
    }
}];
