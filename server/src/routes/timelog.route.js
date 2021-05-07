const express = require('express');
const router = express.Router();
const timelogController = require('../controllers/timelog.controller');
const errorHandler = require('../utils/errorHandler');
const { logSchema, getlogSchema, getLogByDaySchema } = require('../utils/timelogValidator');

router.get('/getlog', getlogSchema, errorHandler(timelogController.getlog));
router.post('/log', logSchema, errorHandler(timelogController.log));

module.exports = router;