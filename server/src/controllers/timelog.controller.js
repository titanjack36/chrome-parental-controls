const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const HttpException = require('../utils/httpException');
const timelogService = require('../services/timelog.service');
const timelogModel = require('../models/timelog.model');

class TimelogController {
  log = async (req, res, next) => {
    this.checkValidation(req);
    const { timeStart, timeEnd, siteUrls, extensionId } = req.body;
    siteUrls.forEach(siteUrl => {
      const activeSite = timelogService.getActiveSite(siteUrl, extensionId, timeStart);
      let id;
      if (activeSite) {
        id = activeSite.id;
        timelogModel.update(id, timeEnd);
      } else {
        id = uuidv4();
        timelogModel.create(id, timeStart, timeEnd, siteUrl, extensionId);
      }
      timelogService.setActiveSite(id, timeEnd, siteUrl, extensionId);
    });
    res.send('Successfully logged sites');
  };

  getlog = async (req, res, next) => {
    this.checkValidation(req);
    const { timeStart, timeEnd, extensionId } = req.body;
    const result = await timelogModel.fetch(timeStart, timeEnd, extensionId);
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