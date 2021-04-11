const errorHandler = (controller) => {
  return async (req, res, next) => {
    try {
      await controller(req, res, next);
    } catch (err) {
      if (!err.status || err.status == 500) {
        console.log(err);
        res.status(500).send({ status: 500, message: 'Internal Server Error.' });
      } else {
        res.status(err.status).send(err);
      }
    }
  };
}

module.exports = errorHandler;