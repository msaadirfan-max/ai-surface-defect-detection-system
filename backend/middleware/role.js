const checkUserRole = (req, res, next) => {
  if (!req.user || !req.user.role) {
    // Check if the user object or role is missing in the request 
    return res.status(403).json({ message: "User role not found" });
  }

  if (req.user.role == "admin") {
    // Check if the user's role is "admin" 
    next();
  } else {
    return res
      .status(403)
      .json({ message: "Access denied. Admin privileges required." });
  }
};

module.exports = checkUserRole;
