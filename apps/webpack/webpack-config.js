// Require path.
const path = require('path');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserJSPlugin = require('terser-webpack-plugin');
const fs = require('fs');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
// Configuration object.
const CssUrlRelativePlugin = require('css-url-relative-plugin');
const webpack = require('webpack');
const { VueLoaderPlugin } = require('vue-loader');

const aliases = processAliases();
const frontEndCssEntryPoints = processCssEntryPoints();
const backendEndCssEntryPoints = processCssEntryPoints(false, "backend");
const frontEndCssMinifiedEntryPoints = processCssEntryPoints(true);
const backEndCssMinifiedEntryPoints = processCssEntryPoints(true, "backend");

const frontEndLibCssEntryPoints = processLibCssEntryPoints();
const backEndLibCssEntryPoints = processLibCssEntryPoints(false, "backend");

const frontEndJsEntryPoints = processJsEntryPoints();
const backEndJsEntryPoints = processJsEntryPoints(false, "backend");
const frontEndJsMinifiedEntryPoints = processJsEntryPoints(true);
const backEndJsMinifiedEntryPoints = processJsEntryPoints(true, "backend");

function processAliases() {
    let config = JSON.parse(fs.readFileSync('/webpack/config.json', 'utf8'), true);
    let aliases = {};
    for (let [key, value] of Object.entries(config.aliases)) {
        aliases[key] = path.join(__dirname, value);
    }
    return aliases;
}

function processCssEntryPoints(minified = false, area = "frontend") {
    let config = JSON.parse(fs.readFileSync('/webpack/config.json', 'utf8'), true);
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

function processLibCssEntryPoints(minified = false, area = "frontend") {
    let config = JSON.parse(fs.readFileSync('/webpack/config.json', 'utf8'), true);
    let entryPoints = {};
    let entries = area === "frontend" ? config.cssEntryPoints : config.backendCssEntryPoints
    for (let [key, value] of Object.entries(entries)) {
        if (minified) {
            entryPoints['lib.' + key + '.dist.min.js'] = value + '/lib.config.js';
        } else {
            entryPoints['lib.' + key + '.dist.js'] = value + '/lib.config.js';
        }
    }
    return entryPoints;
}

function processJsEntryPoints(minified = false, area = "frontend") {
    let config = JSON.parse(fs.readFileSync('/webpack/config.json', 'utf8'), true);
    let entryPoints = {};
    let entries = area === "frontend" ? config.jsEntryPoints : config.backendJsEntryPoints
    for (let [key, value] of Object.entries(entries)) {
        if (minified) {
            entryPoints['app.min.js'] = value + '/main.js';
        } else {
            entryPoints['app.js'] = value + '/main.js';
        }
    }
    return entryPoints;
}
console.log(frontEndCssEntryPoints);

var jsConfig = Object.assign(
    buildJsConfig("frontend"),
    {
        mode: 'development',
        devtool: 'source-map',
        entry: frontEndJsEntryPoints,
        plugins: [
            new VueLoaderPlugin()
        ]
    }
);

var jsConfigBackend = Object.assign(
    buildJsConfig("backend"),
    {
        mode: 'development',
        devtool: 'source-map',
        entry: backEndJsEntryPoints,
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"development"'
                }
            }),
            new VueLoaderPlugin()
        ]
    },
)

var jsConfigMin = Object.assign(
    buildJsConfig("frontend"),
    {
        mode: 'production',
        optimization: {
            minimizer: [new TerserJSPlugin({})],
        },
        entry: frontEndJsMinifiedEntryPoints,
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"production"'
                }
            }),
            new VueLoaderPlugin()
        ]
    }
);

var jsConfigMinBackend = Object.assign(
    buildJsConfig("backend"),
    {
        mode: 'production',
        optimization: {
            minimizer: [new TerserJSPlugin({})],
        },
        entry: backEndJsMinifiedEntryPoints,
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    NODE_ENV: '"production"'
                }
            }),
            new VueLoaderPlugin()
        ]
    }
)

function buildJsConfig(location) {
// Configuration object.
    return {
        resolve: {
            modules: [path.join(__dirname, '/node_modules')],
            extensions: ['.js'],
            alias: aliases
        },
        externals: {
            jquery: 'jQuery'
        },
        output: {
            path: path.resolve(__dirname, '/public_html/assets/' + location + '/dist'),
            filename: '[name]',
            sourceMapFilename: '[name].map'
        },
        // Setup a loader to transpile down the latest and great JavaScript so older browsers
        // can understand it.
        module: {
            rules: [
                {
                    test: /\.vue$/,
                    loader: 'vue-loader'
                },
                {
                    // Look for any .js files.
                    test: /\.js$/,
                    // Use babel loader to transpile the JS files.
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                },
                {
                    test: /\.modernizrrc$/,
                    loader: 'modernizr-loader!json-loader',
                },
                {
                    test: /\.css$/,
                    use: [
                        'vue-style-loader',
                        'css-loader'
                    ]
                }
            ]
        }
    }
}

//For lib files
var libCssConfig = Object.assign(
    buildLibCssConfig("frontend"),
    {
        mode: 'production',
        devtool: 'source-map',
        entry: frontEndLibCssEntryPoints,
        plugins: [
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "lib.min.css",
                chunkFilename: "[id].css"
            })
        ],
    }
);

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

//For lib files
var libCssConfigBackend = Object.assign(
    buildLibCssConfig("backend"),
    {
        mode: 'production',
        devtool: 'source-map',
        entry: backEndLibCssEntryPoints,
        plugins: [
            new MiniCssExtractPlugin({
                // Options similar to the same options in webpackOptions.output
                // both options are optional
                filename: "lib.min.css",
                chunkFilename: "[id].css"
            })
        ],
    }
);


//For development side of the website, generates app.css using imported files in app.config.js
var cssConfigBackend = Object.assign(
    buildCssConfig("backend"),
    {
        devtool: 'source-map',
        entry: backendEndCssEntryPoints,
        output: {
            path: path.resolve(__dirname, '/public_html/assets/backend/dist'),
            filename: '[name]',
            sourceMapFilename: '[name].map'
        },
    }
);

var cssConfigBackendMin = Object.assign(
    buildMinCssConfig("backend"),
    {
        resolve: {
            alias: aliases
        },
        entry: backEndCssMinifiedEntryPoints,
        optimization: {
            minimizer: [new TerserJSPlugin({}), new OptimizeCSSAssetsPlugin({map: {inline: false}})],
        },
        output: {
            path: path.resolve(__dirname, '/public_html/assets/backend/dist'),
            filename: '[name]',
            sourceMapFilename: '[name].map'
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
            path: path.resolve(__dirname, '/public_html/assets/' + location + '/dist'),
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

function buildLibCssConfig(location) {
// Configuration object.
    return {
        resolve: {
            alias: aliases
        },
        output: {
            path: path.resolve(__dirname, '/public_html/assets/' + location + '/dist/'),
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
                                publicPath: '/packages/assets/' + location + '/dist'
                            }
                        },
                        {loader: 'css-loader', options: {url: true, sourceMap: true}},
                    ]
                },
                {
                    test: /\.scss$/,
                    use: [
                        {
                            loader: MiniCssExtractPlugin.loader,
                            options: {
                                publicPathRelativeToSource: true,
                                publicPath: '/assets/' + location + '/dist'
                            }
                        },
                        {loader: 'css-loader', options: {url: true, sourceMap: true}},
                        "sass-loader"
                    ]
                },
                {
                    test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
                    use: [
                        {loader: "file-loader", options: {url: false, sourceMap: true}}
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
            path: path.resolve(__dirname, '/public_html/assets/' + location + '/dist/'),
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
                                publicPath: '/packages/ae_theme/themes/ae/dist',
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
module.exports = [jsConfig, jsConfigMin, jsConfigBackend, jsConfigMinBackend,
    libCssConfig, cssConfig, cssConfigMin, cssConfigBackend, cssConfigBackendMin, libCssConfigBackend];
