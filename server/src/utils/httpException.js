class HttpException extends Error {
  constructor(status, message, data) {
    super(message);
    this.status = status;
    this.errorMsg = message;
    this.data = data;
  }
}

module.exports = HttpException;