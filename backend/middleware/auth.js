const jwt = require("jsonwebtoken");
require("dotenv").config();

const authMiddleware = (req, res, next) => {
  const authHeader =
    req.headers[
      "authorization"
    ]; /* Get the Authorization header from the request */
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    /* Check if the header is missing or doesn't start with "Bearer " */
    return res
      .status(401)
      .json({ message: "Authorization header missing or invalid" });
  }

  const token =
    authHeader.split(" ")[1]; /* Extract the token from the header */
  if (!token) {
    return res.status(401).json({ message: "Token missing" });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET,
    ); /* Verify the token using the secret key from environment variables */
    req.user = decoded;
    next(); /* Call the next middleware or route handler if the token is valid */
  } catch (error) {
    console.error("JWT verification error:", error.message); /* Log the JWT verification error */
    next(error);
  }
};

module.exports = authMiddleware;
