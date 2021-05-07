const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const HttpException = require('../utils/httpException');
const timelogService = require('../services/timelog.service');
const timelogModel = require('../models/timelog.model');

class TimelogController {
  log = async (req, res, next) => {
    this.checkValidation(req);
    const { startTime, endTime, siteUrls, extensionId } = req.body;
    siteUrls.forEach(siteUrl => {
      const activeSite = timelogService.getActiveSite(siteUrl, extensionId, startTime);
      let id;
      if (activeSite) {
        id = activeSite.id;
        timelogModel.update(id, endTime);
      } else {
        id = uuidv4();
        timelogModel.create(id, startTime, endTime, siteUrl, extensionId);
      }
      timelogService.setActiveSite(id, endTime, siteUrl, extensionId);
    });
    res.send('Successfully logged sites');
  };

  getlog = async (req, res, next) => {
    this.checkValidation(req);
    const { startTime, endTime, extensionId, sort } = req.query;
    let order = [];
    if (sort) {
      order = sort.split(',').map(entryStr => {
        const entry = entryStr.split(':');
        return { orderBy: entry[0], isDesc: entry[1] === 'descending' };
      });
    }
    const result = await timelogModel.fetch(startTime, endTime, extensionId, order);
    res.send(JSON.stringify(result));
  }

  checkValidation = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpException(400, 'Validation failed.', errors);
    }
  }
}

module.exports = new TimelogController();