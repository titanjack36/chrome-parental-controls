const mysql = require("mysql2");
const format = require("date-fns/format");
const dotenv = require("dotenv");
dotenv.config();

class DbService {
  constructor() {
    this.db = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME
    });
  }

  query = async (sql, values) => {
    return new Promise((resolve, reject) => {
      this.db.execute(sql, values, (err, res) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(res);
      });
    });
  }

  toSqlTimeFormat = (datetime) => {
    return format(datetime, 'yyyy-MM-dd HH:mm:ss');
  }
}

const dbServiceObj = new DbService();
module.exports = {
  query: dbServiceObj.query,
  toSqlTimeFormat: dbServiceObj.toSqlTimeFormat
};