const Node = require("../models/Nodes");
const Employee = require("../models/Employees");

// Create node
exports.createNode = async (req, res) => {

    try {
        const {
            name,
            path,
            icon,
            allowedRoles,
            allowedDesignations
        } = req.body;

        // Check duplicate path
        const existingNode = await Node.findOne({ path });

        if (existingNode) {
            return res.status(409).json({
                message: "Node path already exists"
            });
        }

        // Create node
        const node = await Node.create({
                name,
                path,
                icon,
                allowedRoles,
                allowedDesignations
            });

        return res.status(201).json({
            message: "Node created successfully",
            node
        });

    }
    catch (err) {
        console.error("Error during node creation:", err);
        return res.status(500).json({
            message: "Server error during node creation"
        });
    }
};

// Update node
exports.updateNode = async (req, res) => {

    try {
        const {
            name,
            path,
            icon,
            allowedRoles,
            allowedDesignations
        } = req.body;

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (path !== undefined) {
            updateData.path = path;
        }

        if (icon !== undefined) {
            updateData.icon = icon;
        }

        if (allowedRoles !== undefined) {
            updateData.allowedRoles = allowedRoles;
        }

        if (allowedDesignations !== undefined) {
            updateData.allowedDesignations = allowedDesignations;
        }

        const updatedNode = await Node.findOneAndUpdate(
                {
                    nodeId: req.params.nodeId
                },

                updateData,

                {
                    new: true,
                    runValidators: true
                }
            );

        if (!updatedNode) {
            return res.status(404).json({
                message: "Node not found"
            });
        }

        return res.status(200).json({
            message: "Node updated successfully",
            node: updatedNode
        });
    }
    catch (err) {
        console.error("Error during node update:", err);
        return res.status(500).json({
            message: "Server error during node update"
        });
    }
};

// Delete node
exports.deleteNode = async (req, res) => {

    try {
        const deletedNode =
            await Node.findOneAndDelete({
                nodeId: req.params.nodeId
            });

        if (!deletedNode) {
            return res.status(404).json({
                message: "Node not found"
            });
        }

        return res.status(200).json({
            message: "Node deleted successfully"
        });

    }
    catch (err) {
        console.error("Error during node deletion:", err);
        return res.status(500).json({
            message: "Server error during node deletion"
        });
    }
};

// Get sidebar nodes
exports.getMyNodes = async (req, res) => {

    try {
        const employee = await Employee.findOne({
                employeeCode: req.user.employeeCode
            });

        if (!employee) {
            return res.status(404).json({
                message: "Employee not found"
            });
        }

        const roles = req.user.roles;

        const designation = employee.designation;

        const nodes = await Node.find({
                $or: [
                    {
                        allowedRoles: { $in: roles }
                    },
                    {
                        allowedDesignations: designation
                    }
                ]
            })
            .select("-_id -__v");

        return res.status(200).json({
            totalNodes: nodes.length,
            nodes
        });

    }
    catch (err) {
        console.error("Error fetching nodes:", err);
        return res.status(500).json({
            message: "Server error while fetching nodes"
        });
    }
};