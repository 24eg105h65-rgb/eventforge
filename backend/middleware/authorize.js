const authorize = (...roles) => (req, res, next) => {
  if (!req.user) {
    const error = new Error('Authentication is required.');
    error.statusCode = 401;
    return next(error);
  }

  if (!roles.includes(req.user.role)) {
    const error = new Error('You do not have permission to perform this action.');
    error.statusCode = 403;
    return next(error);
  }

  return next();
};

module.exports = authorize;
