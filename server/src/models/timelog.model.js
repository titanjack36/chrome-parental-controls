const SqlString = require('sqlstring');

const formatDuration = require('date-fns/formatDuration')

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

  fetch = async (startTime, endTime, extensionId, order = []) => {
    let mappedOrder = order.map(o => {
      let mappedOrderBy;
      switch (o.orderBy) {
        case 'startTime':
          mappedOrderBy = 'time_start';
          break;
        case 'endTime':
          mappedOrderBy = 'time_end';
          break;
        case 'siteUrl':
          mappedOrderBy = 'site_url';
          break;
        case 'duration':
          mappedOrderBy = 'duration';
          break;
        default: break;
      }
      return mappedOrderBy ? 
        { orderBy: mappedOrderBy, isDesc: o.isDesc } : undefined;
    }).filter(o => o);
    if (mappedOrder.length === 0) {
      mappedOrder = [{ orderBy: 'time_start', isDesc: true }];
    }
    const sqlOrderStr = mappedOrder.reduce((totalOrderStr, o) => {
      const orderStr = `${SqlString.escapeId(o.orderBy)} ${o.isDesc ? 'DESC' : 'ASC'}`;
      return totalOrderStr ? `${totalOrderStr}, ${orderStr}` : orderStr;
    }, '');

    const sqlStr = `SELECT * FROM ${this.table}
      WHERE extension_id = ? AND time_start >= ? AND time_end < ?
      ORDER BY ${sqlOrderStr}`;
    const result = await query(sqlStr, [
      extensionId,
      toSqlTimeFormat(startTime),
      toSqlTimeFormat(endTime)
    ]);
    return result.map(entry => ({
      id: entry.id,
      startTime: entry.time_start,
      endTime: entry.time_end,
      siteUrl: entry.site_url,
      duration: entry.duration
    }));
  };
}

module.exports = new TimelogModel();