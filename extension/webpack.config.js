const path = require('path');
const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = {
  entry: {
    'background': `./src/scripts/background/background.ts`,
    'site-monitor': [
      `./src/scripts/site/site-monitor.ts`,
      `./src/scripts/site/site-timer.css`,
      `./src/scripts/site/site-blockscreen.css`
    ],
    'redirect-page': [
      `./src/redirect-page/redirect-page.ts`,
      `./src/redirect-page/redirect-page.css`,
    ],
    'popup': [
      `./src/popup/popup.js`
    ]
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts']
  },
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.ts?$/,
        use: 'ts-loader'
      },
    ]
  },
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: `./src/redirect-page/redirect-page.html`,
              destination: './dist/',
            },
            {
              source: `./src/popup/popup.html`,
              destination: './dist/',
            },
            {
              source: `./manifest.json`,
              destination: './dist/',
            },
            {
              source: `./src/assets`,
              destination: './dist/assets',
            }
          ]
        }
      }
    })
  ],
  mode: 'development',
  optimization: {
    minimize: false
  },
  devtool : 'source-map',
  watchOptions: {
    ignored: /node_modules/,
  }
};