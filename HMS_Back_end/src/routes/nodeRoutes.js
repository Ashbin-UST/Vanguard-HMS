const express = require("express");
const router = express.Router();
const { body, param } = require("express-validator");
const validate = require("../middlewares/validate");
const auth = require("../middlewares/authMiddleware");
const authorizeRoles = require("../middlewares/authorizeRolesMiddleware");
const controller = require("../controllers/nodeController");
const { STAFF_DESIGNATIONS, RESTRICTED_ROLES } = require("../constants/domain");

// All the routes require authentication
router.use(auth);

// Validates node name, path format, and allowed designation values
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
        .isIn([...STAFF_DESIGNATIONS, ...RESTRICTED_ROLES])
        .withMessage("Valid designation is required")
];

// Same as createNodeValidation but all fields are optional
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
        .isIn([...STAFF_DESIGNATIONS, ...RESTRICTED_ROLES])
        .withMessage("Valid designation is required")
];

// Validates the nodeId URL parameter
const nodeIdValidation = [

    param("nodeId")
        .notEmpty()
        .withMessage("Node ID is required")
];

// Node management routes (ADMIN / OWNER only)
router.post(
    "/create-node",
    authorizeRoles("ADMIN", "OWNER"),
    createNodeValidation,
    validate,
    controller.createNode
);

router.put(
    "/update-node/:nodeId",
    authorizeRoles("ADMIN", "OWNER"),
    updateNodeValidation,
    validate,
    controller.updateNode
);

router.delete(
    "/delete-node/:nodeId",
    authorizeRoles("ADMIN", "OWNER"),
    nodeIdValidation,
    validate,
    controller.deleteNode
);

// Returns the sidebar nodes visible to the authenticated user's designation
router.get(
    "/my-nodes",
    controller.getMyNodes
);

module.exports = router;
