const FileManagerPlugin = require('filemanager-webpack-plugin');

module.exports = {
  entry: './src/server.js',
  target: "node",
  mode: "production",
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
  plugins: [
    new FileManagerPlugin({
      events: {
        onEnd: {
          copy: [
            {
              source: `./.env`,
              destination: './dist/',
            },
          ]
        }
      }
    })
  ],
};