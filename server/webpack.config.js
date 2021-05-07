module.exports = {
  entry: './src/server.js',
  target: "node",
  mode: "production",
  node: {
    global: false,
    __filename: false,
    __dirname: false,
  },
};