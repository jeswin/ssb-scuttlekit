const webpack = require("webpack");
const path = require("path");

/*
 * We've enabled UglifyJSPlugin for you! This minifies your app
 * in order to load faster and run less javascript.
 *
 * https://github.com/webpack-contrib/uglifyjs-webpack-plugin
 *
 */

const UglifyJSPlugin = require("uglifyjs-webpack-plugin");

/*
 * We've enabled ExtractTextPlugin for you. This allows your app to
 * use css modules that will be moved into a separate CSS file instead of inside
 * one of your module entries!
 *
 * https://github.com/webpack-contrib/extract-text-webpack-plugin
 *
 */

const ExtractTextPlugin = require("extract-text-webpack-plugin");

module.exports = {
  entry: "./src/client/index.tsx",

  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "./dist/client")
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "babel-loader",

        options: {
          presets: ["env"]
        }
      },
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/
      },
      {
        test: /\.css$/,

        use: ExtractTextPlugin.extract({
          use: [
            {
              loader: "css-loader",
              options: {
                sourceMap: true
              }
            }
          ],
          fallback: "style-loader"
        })
      }
    ]
  },

  resolve: {
    extensions: [".tsx", ".ts", ".js"]
  },

  plugins: [new UglifyJSPlugin(), new ExtractTextPlugin("style.css")]
};
