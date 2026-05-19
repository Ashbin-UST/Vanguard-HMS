const authorizeOwner = (req, res, next) => {

    if (!req.user.roles.includes("OWNER")) {
        return res.status(403).json({
            message: "Access denied"
        });
    }
    
    next();
};

module.exports = authorizeOwner;