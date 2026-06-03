const authorizeRoles = (...allowedRoles) => {

    return (req, res, next) => {

        // Ensure user exists
        if (!req.user) {
            return res.status(401).json({
                message: "Unauthorized access"
            });
        }

        // Check if user has at least one allowed role
        const hasPermission =
            req.user.roles.some((role) =>
                allowedRoles.includes(role)
            );

        if (!hasPermission) {
            return res.status(403).json({
                message: "Access denied"
            });
        }

        next();
    };
};

module.exports = authorizeRoles;