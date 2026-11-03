const jwt = require('jsonwebtoken');

/**
 * Generate a signed JWT for a given user ID.
 * @param {string} id - MongoDB user _id
 * @returns {string} JWT token (expires in 30 days)
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

module.exports = generateToken;
