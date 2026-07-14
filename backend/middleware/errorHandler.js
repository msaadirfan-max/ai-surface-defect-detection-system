const errorHandler = (err, req, res, next) => {            /* Custom error handling middleware */
  console.error("ERROR:", err.message);                    /* Log the error message to the console */
  console.error("STACK:", err.stack);                      /* Log the stack trace to the console for debugging purposes */
  res.status(err.statusCode || err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;