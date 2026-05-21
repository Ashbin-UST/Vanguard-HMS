const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/nodeController");

// All routes require authentication
router.use(auth);

const nodeValidation = [

    body("name")
        .notEmpty()
        .withMessage("Node name is required"),

    body("path")
        .notEmpty()
        .withMessage("Node path is required")
        .matches(/^\/.*/)
        .withMessage("Path must start with /"),

    body("allowedRoles")
        .isArray({ min: 1 })
        .withMessage("At least one allowed role is required"),

    body("allowedDesignations")
        .optional()
        .isArray()
        .withMessage("Allowed designations must be an array")
];

const nodeIdValidation = [
    param("nodeId")
        .notEmpty()
        .withMessage("Node ID is required")
];

// Create node
router.post(
    "/create-node",
    authorizeRoles("ADMIN", "OWNER"),
    nodeValidation,
    validate,
    controller.createNode
);

// Update node
router.put(
    "/update-node/:nodeId",
    authorizeRoles("ADMIN", "OWNER"),
    nodeIdValidation,
    validate,
    controller.updateNode
);

// Delete node
router.delete(
    "/delete-node/:nodeId",
    authorizeRoles("ADMIN", "OWNER"),
    nodeIdValidation,
    validate,
    controller.deleteNode
);

// Get sidebar nodes
router.get(
    "/my-nodes",
    controller.getMyNodes
);

module.exports = router;