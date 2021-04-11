const express = require("express");
const dotenv = require("dotenv");
const timelogRouter = require('./routes/timelog.route');
const HttpException = require('./utils/httpException');
const errorHandler = require('./utils/errorHandler');
const cors = require('cors');

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

const port = parseInt(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Server is running on port ${port}.`);
});