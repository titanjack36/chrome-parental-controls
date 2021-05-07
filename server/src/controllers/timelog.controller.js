const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const HttpException = require('../utils/httpException');
const timelogService = require('../services/timelog.service');
const timelogModel = require('../models/timelog.model');

const startOfDay = require('date-fns/startOfDay');
const endOfDay = require('date-fns/endOfDay');
const addDays = require('date-fns/addDays');
const formatDistance = require('date-fns/formatDistance');
const format = require('date-fns/format');

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
    const { startTime, endTime, extensionId } = req.query;
    const result = await timelogModel.fetch(startTime, endTime, extensionId);
    res.send(JSON.stringify(result.map(entry => this.timelogDbMap(entry))));
  }

  checkValidation = (req) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new HttpException(400, 'Validation failed.', errors);
    }
  }

  timelogDbMap = (entry) => {
    return {
      id: entry.id,
      startTime: entry.time_start,
      endTime: entry.time_end,
      siteUrl: entry.site_url,
      duration: formatDistance(entry.time_end, entry.time_start)
    }
  }
}

module.exports = new TimelogController();