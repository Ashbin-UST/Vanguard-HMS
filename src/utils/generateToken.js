const jwt = require('jsonwebtoken')
const crypto = require('node:crypto')

const generateAccessToken = (payload) => {
  return jwt.sign(
    payload, 
    process.env.JWT_SECRET,
    {expiresIn: process.env.JWT_EXPIRES_IN || '7d'}
  );
};

const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

const generateRandomToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

const getExpiryDate = (hours) => {
  return new Date(Date.now() + hours*60*60*1000);
};

module.exports = {
  generateAccessToken, 
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateRandomToken, 
  getExpiryDate
};