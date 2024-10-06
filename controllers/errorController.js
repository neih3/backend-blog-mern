// Centralized error handling middleware
module.exports.errorHandler = (err, req, res, next) => {
  // If the error doesn't have a status, default to 500 (Internal Server Error)
  const statusCode = err.status || 500;

  res.status(statusCode).json({
    status: statusCode,
    message: err.message || "An unknown error occurred",
  });

  // Log the error for debugging purposes
  console.error(err);
};
