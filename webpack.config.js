/**
 * Webpack client-side config file
 */
const path = require('path')
const webpack = require('webpack')
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const TerserPlugin = require('terser-webpack-plugin')
const isProd = process.env.NODE_ENV === 'production'

// dev server and globals styles
const serverHost = '127.0.0.1'
const serverPort = 8080
const basePath = path.join(__dirname, '/')
const appEntry = './src/app.js'
const bundleDir = './public/bundles/'

// webpack config
module.exports = {
  mode: isProd ? 'production' : 'development',
  devtool: isProd ? false : 'source-map',
  entry: {
    app: appEntry,
  },

  output: {
    path: basePath,
    filename: path.join(bundleDir, '[name].min.js'),
  },

  module: {
    rules: [
      {
        test: /\.(jpe?g|png|gif|svg|map|css|eot|woff|woff2|ttf)$/,
        loader: 'ignore-loader',
      },
      {
        test: /\.scss$/i,
        exclude: /node_modules/,
        use: [
          MiniCssExtractPlugin.loader,
          // Translates CSS into CommonJS
          { loader: 'css-loader', options: { url: false, sourceMap: !isProd } },
          // Compiles Sass to CSS
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sourceMap: !isProd,
            },
          },
        ],
      },
      {
        test: /\.js(\?.*)?$/i,
        exclude: /node_modules/,
        loader: 'babel-loader',
      },
    ],
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: path.join(bundleDir, '[name].min.css'),
    }),
  ],
  optimization: {
    minimize: isProd,
    minimizer: [
      // CSS minimizer
      new CssMinimizerPlugin({
        minimizerOptions: {
          preset: [
            'default',
            {
              discardComments: { removeAll: true },
            },
          ],
        },
        minify: CssMinimizerPlugin.cleanCssMinify,
      }),
      // Javascript minimizer
      new TerserPlugin({
        terserOptions: {
          ecma: 2018,
          warnings: false,
          parse: {},
          compress: {},
          mangle: true,
          module: false,
          output: null,
          toplevel: false,
          nameCache: null,
          ie8: false,
          keep_classnames: undefined,
          keep_fnames: false,
          safari10: false,
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },

  devServer: {
    host: serverHost,
    port: serverPort,
    hot: true,
    liveReload: true,
    open: true,
    compress: true,
  },

  performance: {
    hints: isProd ? 'warning' : false,
    maxEntrypointSize: 614400,
    maxAssetSize: 614400,
  },
}
