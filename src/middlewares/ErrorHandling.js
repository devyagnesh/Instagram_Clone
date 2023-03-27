/* ||_____ GLOBAL ERROR HANDLING MIDDLEWARE _____|| */
function errorHandler(err, req, res, next) {
  // Default status code to 500 if not defined
  const statusCode = err.code || 500;

  // Default error message to "Internal Server Error" if not defined
  const errorMessage = err.message || "Internal Server Error";

  // Create error response object
  const errorResponse = {
    error: {
      code: statusCode,
      message: errorMessage,
      details: err.details || {},
    },
  };

  return res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;
