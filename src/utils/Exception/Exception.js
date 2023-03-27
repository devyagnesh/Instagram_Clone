class Exceptions extends Error {
  constructor(statusCode,message, details) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.code = statusCode;
    this.message = message;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

function Exception(statusCode,message, details) {
  return new Exceptions(statusCode,message, details);
}

module.exports = Exception;
