// Require path.
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// Configuration object.
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const webpack = require('webpack');

const aliases = processAliases();
const frontEndCssEntryPoints = processCssEntryPoints();
const backendEndCssEntryPoints = processCssEntryPoints(false, "backend");
const frontEndCssMinifiedEntryPoints = processCssEntryPoints(true);
const backEndCssMinifiedEntryPoints = processCssEntryPoints(true, "backend");

function processAliases() {
    let config = JSON.parse(fs.readFileSync('/apps/webpack/config.json', 'utf8'), true);
    let aliases = {};
    for (let [key, value] of Object.entries(config.aliases)) {
        aliases[key] = path.join(__dirname, value);
    }
    return aliases;
}

function processCssEntryPoints(minified = false, area = "frontend") {
    let config = JSON.parse(fs.readFileSync('/apps/webpack/config.json', 'utf8'), true);
    let entryPoints = {};
    let entries = area === "frontend" ? config.cssEntryPoints : config.backendCssEntryPoints
    for (let [key, value] of Object.entries(entries)) {
        if (minified) {
            entryPoints['app.' + key + '.dist.min.js'] = value + '/app.config.js';
        } else {
            entryPoints['app.' + key + '.dist.js'] = value + '/app.config.css';
        }
    }
    return entryPoints;
}

console.log(frontEndCssEntryPoints);

//For development side of the website, generates app.css using imported files in app.config.js
var cssConfig = Object.assign(
    buildCssConfig("frontend"),
    {
        mode: 'development',
        devtool: 'source-map',
        entry: frontEndCssEntryPoints
    }
);

//For production side of the website, generates app.min.css using imported files in app.config.js
//This optimizes the css
var cssConfigMin = Object.assign(
    buildMinCssConfig("frontend"),
    {
        mode: 'production',
        entry: frontEndCssMinifiedEntryPoints,
        optimization: {
            minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({map: {inline: false}})],
        },
        plugins: [

            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "app.min.css",
                chunkFilename: "[id].css",
            }),
            new OptimizeCSSAssetsPlugin({
                cssProcessorOptions: {
                    canPrint: true
                }
            })
        ],
    }
);

function buildCssConfig(location) {
// Configuration object.
    return {
        resolve: {},
        output: {
            path: path.resolve(__dirname, '/css/'),
            filename: '[name]',
            sourceMapFilename: '[name].map',
            // devtoolModuleFilenameTemplate: (info) => 'file://' + path.resolve(info.absoluteResourcePath)
        },
        devtool: 'source-map',
        // Setup a loader to transpile down the latest and great JavaScript so older browsers
        // can understand it.
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        'style-loader',
                        {loader: 'css-loader', options: {url: true, sourceMap: true, import: true}},
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [
                                    require('autoprefixer'),
                                ],
                                sourceMap: false
                            }
                        },
                    ]
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        "file-loader"
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                        },
                    ],
                },
            ]
        }
    }
}

function buildMinCssConfig(location) {
// Configuration object.
    console.log();
    return {
        resolve: {
            alias: aliases
        },
        output: {
            path: path.resolve(__dirname, '/css/'),
            filename: '[name]',
            sourceMapFilename: '[name].map'
        },
        devtool: 'source-map',
        // Setup a loader to transpile down the latest and great JavaScript so older browsers
        // can understand it.
        module: {
            rules: [
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPathRelativeToSource: true,
                                publicPath: '/css',
                            }
                        },
                        {loader: 'css-loader', options: {url: false, sourceMap: true}},
                        {
                            loader: 'postcss-loader',
                            options: {
                                plugins: () => [
                                    require('autoprefixer'),
                                ],
                                sourceMap: true
                            }
                        },
                    ]
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        "file-loader"
                    ]
                },
                {
                    test: /\.(png|jpe?g|gif)$/i,
                    use: [
                        {
                            loader: 'file-loader',
                        },
                    ],
                },
            ]
        }
    }
}


// Export the config object.
module.exports = [cssConfig, cssConfigMin];
