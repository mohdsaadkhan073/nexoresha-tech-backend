const jwt = require("jsonwebtoken");
const Admin = require("../models/admin.model");

const adminAuth = async (req, res, next) => {
    try {
        let token;
        
        // Check for Bearer token in the Authorization header
        if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
            token = req.headers.authorization.split(" ")[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Access denied. No token provided."
            });
        }

        // Verify the JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the admin user and exclude the password field
        const admin = await Admin.findById(decoded.id).select("-password");
        if (!admin) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Admin user not found."
            });
        }

        // Check if token version matches to detect if logged out/invalidated
        if (decoded.tokenVersion !== admin.tokenVersion) {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token has been invalidated or admin logged out."
            });
        }

        // Attach the admin document to the request object
        req.admin = admin;
        next();
    } catch (error) {
        console.error("Authentication error:", error.message);
        
        // Handle expiration or malformed tokens specifically
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access denied. Token has expired."
            });
        }
        
        return res.status(401).json({
            success: false,
            message: "Access denied. Invalid token."
        });
    }
};

module.exports = adminAuth;
