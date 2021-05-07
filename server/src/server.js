const express = require("express");
const dotenv = require("dotenv");
const timelogRouter = require('./routes/timelog.route');
const HttpException = require('./utils/httpException');
const errorHandler = require('./utils/errorHandler');
const cors = require('cors');
const http = require('http');

// const path = require('path');
// const fs = require('fs');
// const https = require('https');

// const key = fs.readFileSync(path.resolve(__dirname + '/../certs/server.key'));
// const cert = fs.readFileSync(path.resolve(__dirname + '/../certs/server.crt'));
// const credentials = { key, cert };

dotenv.config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use(cors());
app.options("*", cors());

app.use(`/api/v1/timelog`, timelogRouter);

app.all('*', errorHandler((req, res, next) => {
  throw new HttpException(404, 'Unknown route.');
}));

const httpServer = http.createServer(app);
// const httpsServer = https.createServer(credentials, app);

const httpPort = parseInt(process.env.HTTP_PORT || 3000);
httpServer.listen(httpPort, () => {
  console.log(`HTTP Server is running on port ${httpPort}.`);
});

// const httpsPort = parseInt(process.env.HTTPS_PORT || 3001);
// httpsServer.listen(httpsPort, () => {
//   console.log(`HTTPS Server is running on port ${httpsPort}.`);
// });