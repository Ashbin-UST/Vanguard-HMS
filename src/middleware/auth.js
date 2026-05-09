const jwt = require("jsonwebtoken");
 
const auth = async (req, res, next) => {
    try {
 
        // Get token from header
        const authHeader = req.headers.authorization;
 
        // Check token exists
        if (!authHeader) {
            return res.status(401).json({
                message: "Token not found",
            });
        }
 
        // Format: Bearer token
        const token = authHeader.split(" ")[1];
 
        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );
 
        // Store decoded user data
        req.user = decoded;
 
        next();
 
    } catch (error) {
 
        return res.status(401).json({
            message: "Invalid token",
        });
 
    }
};
 
module.exports = auth;