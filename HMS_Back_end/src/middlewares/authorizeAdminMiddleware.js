const authorizeAdmin = (req, res, next) => {

    if (!["ADMIN", "OWNER"].some(role => req.user.roles.includes(role))) {
        return res.status(403).json({
            message: "Access denied"
        });
    }

    next();
};

module.exports = authorizeAdmin;