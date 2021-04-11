const { body } = require('express-validator');

exports.logSchema = [
  body('timeStart')
    .exists()
    .isISO8601()
    .toDate(),
  body('timeEnd')
    .exists()
    .isISO8601()
    .toDate(),
  body('siteUrls')
    .exists()
    .isArray(),
  body('extensionId')
    .exists()
    .isString()
];

exports.getlogSchema = [
  body('timeStart')
    .exists()
    .isISO8601()
    .toDate(),
  body('timeEnd')
    .exists()
    .isISO8601()
    .toDate(),
  body('extensionId')
    .exists()
    .isString()
];