const getCurrentUser = require("../utils/getCurrentUser");

// Get current authenticated user + profile
exports.getMe = async (req, res) => {

    try {
        return await getCurrentUser(req.user.employeeCode, res);
    }
    catch (err) {
        console.error("Error during getMe: ", err);
        return res.status(500).json({
            message: "Server error while fetching current user"
        });
    }
};