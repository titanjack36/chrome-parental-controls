const { query, toSqlTimeFormat } = require("../services/db.service");

class TimelogModel {
  table = 'timelog';

  create = async (id, timeStart, timeEnd, siteUrl, extensionId) => {
    const sqlStr = `INSERT INTO ${this.table}(id, time_start, time_end, site_url, extension_id) 
      VALUES(?, ?, ?, ?, ?)`;
    return await query(sqlStr, [
      id,
      toSqlTimeFormat(timeStart),
      toSqlTimeFormat(timeEnd),
      siteUrl,
      extensionId
    ]);
  };

  update = async (id, newTimeEnd) => {
    const sqlStr = `UPDATE ${this.table} SET time_end = ? WHERE id = ?`;
    return await query(sqlStr, [toSqlTimeFormat(newTimeEnd), id]);
  };

  cleanup = async (expiryTime) => {
    const sqlStr = `DELETE FROM ${this.table} WHERE time_start < ?`;
    return await query(sqlStr, [toSqlTimeFormat(expiryTime)]);
  };

  fetch = async (timeStart, timeEnd, extensionId) => {
    const sqlStr = `SELECT * FROM ${this.table} WHERE extension_id = ? AND time_start >= ? AND time_end < ?`;
    return await query(sqlStr, [
      extensionId,
      toSqlTimeFormat(timeStart),
      toSqlTimeFormat(timeEnd)
    ]);
  };
}

module.exports = new TimelogModel();