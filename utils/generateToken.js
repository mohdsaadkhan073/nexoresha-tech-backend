const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT token for the admin
 * @param {string} id - Admin ID
 * @param {string} email - Admin Email
 * @param {number} tokenVersion - Current Token Version
 * @returns {string} Signed JWT Token
 */
const generateToken = (id, email, tokenVersion) => {
    return jwt.sign({ id, email, tokenVersion }, process.env.JWT_SECRET, {
        expiresIn: "1d"
    });
};

module.exports = generateToken;
