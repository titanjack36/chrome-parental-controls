const { body, query } = require('express-validator');

exports.logSchema = [
  body('startTime')
    .exists()
    .isISO8601()
    .toDate(),
  body('endTime')
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
  query('startTime')
    .exists()
    .isISO8601()
    .toDate(),
  query('endTime')
    .exists()
    .isISO8601()
    .toDate(),
  query('extensionId')
    .exists()
    .isString()
];