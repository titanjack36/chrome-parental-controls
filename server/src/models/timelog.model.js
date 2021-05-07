const { query, toSqlTimeFormat } = require("../services/db.service");

class TimelogModel {
  table = 'timelog';

  create = async (id, startTime, endTime, siteUrl, extensionId) => {
    const sqlStr = `INSERT INTO ${this.table}(id, time_start, time_end, site_url, extension_id) 
      VALUES(?, ?, ?, ?, ?)`;
    return await query(sqlStr, [
      id,
      toSqlTimeFormat(startTime),
      toSqlTimeFormat(endTime),
      siteUrl,
      extensionId
    ]);
  };

  update = async (id, newEndTime) => {
    const sqlStr = `UPDATE ${this.table} SET time_end = ? WHERE id = ?`;
    return await query(sqlStr, [toSqlTimeFormat(newEndTime), id]);
  };

  cleanup = async (expiryTime) => {
    const sqlStr = `DELETE FROM ${this.table} WHERE time_start < ?`;
    return await query(sqlStr, [toSqlTimeFormat(expiryTime)]);
  };

  fetch = async (startTime, endTime, extensionId) => {
    const sqlStr = `SELECT * FROM ${this.table} WHERE extension_id = ? AND time_start >= ? AND time_end < ?`;
    return await query(sqlStr, [
      extensionId,
      toSqlTimeFormat(startTime),
      toSqlTimeFormat(endTime)
    ]);
  };
}

module.exports = new TimelogModel();