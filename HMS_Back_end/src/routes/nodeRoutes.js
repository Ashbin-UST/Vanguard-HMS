const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/nodeController");

// All routes require authentication
router.use(auth);

const allowedDesignationTypes = new Set([
    "OWNER",
    "ADMIN",
    "DOCTOR",
    "RECEPTIONIST",
    "CASHIER",
    "NURSE",
    "LAB_TECH",
    "PHARMACIST"
]);

const createNodeValidation = [

    body("name")
        .notEmpty()
        .withMessage("Node name is required"),

    body("path")
        .notEmpty()
        .withMessage("Node path is required")
        .matches(/^\/.*/)
        .withMessage("Path must start with /"),

    body("allowedDesignations")
        .isArray({ min: 1 })
        .withMessage("At least one allowed designation is required"),

    body("allowedDesignations.*")
        .isIn([...allowedDesignationTypes])
        .withMessage("Valid designation is required")
];

const updateNodeValidation = [

    param("nodeId")
        .notEmpty()
        .withMessage("Node ID is required"),

    body("name")
        .optional()
        .notEmpty()
        .withMessage("Node name cannot be empty"),

    body("path")
        .optional()
        .notEmpty()
        .withMessage("Node path cannot be empty")
        .matches(/^\/.*/)
        .withMessage("Path must start with /"),

    body("allowedDesignations")
        .optional()
        .isArray({ min: 1 })
        .withMessage(
            "At least one allowed designation is required"
        ),

    body("allowedDesignations.*")
        .optional()
        .isIn([...allowedDesignationTypes])
        .withMessage("Valid designation is required")
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
    createNodeValidation,
    validate,
    controller.createNode
);

// Update node
router.put(
    "/update-node/:nodeId",
    authorizeRoles("ADMIN", "OWNER"),
    updateNodeValidation,
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