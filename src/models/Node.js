const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema ({
    nodeCode: {
        type: String,
        unique: true
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    roles: [{
            type: String,
            enum: ["OWNER", "ADMIN", "DOCTOR", "RECEPTIONIST", 
                "CASHIER", "NURSE", "LAB_TECH", "PHARMACIST"],
            required: true
        }],
    link: {
        type: String,
    }
})

module.exports = mongoose.model("Node", nodeSchema);