const User = require('../models/userModel');
const { verifyAccessToken } = require('../utils/generateToken');

const protect = async (req, res, next) => {
  try{
  let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

  if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided. Please login first',
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token. Please login again',
      });
    }

    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User no longer exists',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is INACTIVE. Contact administrator',
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;

    const hasPermission = userRoles.some((role) =>
      allowedRoles.includes(role)
    );

    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: [${allowedRoles.join(', ')}]. Your roles: [${userRoles.join(', ')}]`,
      });
    }

    next();
  };
};

module.exports = { protect, authorize };