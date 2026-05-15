const authorizeAdmin = (req, res, next) => {

    if (!req.user.roles.includes("ADMIN")) {
        return res.status(403).json({
            message: "Access denied"
        });
    }
    
    next();
};

module.exports = authorizeAdmin;