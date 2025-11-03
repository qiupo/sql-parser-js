/**
 * Webpack Configuration
 *
 * Configuration for building UMD modules and browser-compatible bundles
 */

const path = require("path");
const TerserPlugin = require("terser-webpack-plugin");

const createConfig = (env, target) => ({
  mode: env === "production" ? "production" : "development",

  entry: "./src/index.js",

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: target === "min" ? "sql-parser.min.js" : "sql-parser.js",
    library: {
      name: "SQLParser",
      type: "umd",
      export: "default",
    },
    globalObject: "typeof self !== 'undefined' ? self : this",
    clean: target === "normal", // Only clean on first build
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "@babel/preset-env",
                {
                  targets: {
                    browsers: ["> 1%", "last 2 versions", "ie >= 11"],
                  },
                  modules: false,
                },
              ],
            ],
            plugins: [
              "@babel/plugin-proposal-class-properties",
              "@babel/plugin-proposal-object-rest-spread",
            ],
          },
        },
      },
    ],
  },

  resolve: {
    extensions: [".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },

  optimization: {
    minimize: target === "min",
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          compress: {
            drop_console: env === "production",
            drop_debugger: env === "production",
          },
          mangle: {
            reserved: [
              "SQLParser",
              "parseSQL",
              "validateSQL",
              "extractTables",
              "extractColumns",
            ],
          },
          format: {
            comments: false,
          },
        },
        extractComments: false,
      }),
    ],
  },

  devtool: env === "production" ? "source-map" : "eval-source-map",

  performance: {
    hints: env === "production" ? "warning" : false,
    maxEntrypointSize: 250000,
    maxAssetSize: 250000,
  },

  stats: {
    colors: true,
    modules: false,
    children: false,
    chunks: false,
    chunkModules: false,
  },
});

module.exports = (env = {}) => {
  const environment = env.production ? "production" : "development";

  return [
    createConfig(environment, "normal"),
    createConfig(environment, "min"),
  ];
};
