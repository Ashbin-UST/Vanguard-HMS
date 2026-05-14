const Node = require("../models/Nodes");

// Create node (ADMIN only)
exports.createNode = async (req, res) => {
    try {
        const {
            name,
            url,
            allowedRoles
        } = req.body;

        const existingNode =
            await Node.findOne({ url });

        if (existingNode) {
            return res.status(409).json({
                message: "Node URL already exists"
            });
        }

        const node = await Node.create({
            name,
            url,
            allowedRoles
        });

        res.status(201).json({
            message: "Node created successfully",
            node
        });

    } 
    catch (err) {
        console.error("Error during node creation:", err);
        res.status(500).json({
            message:"Server error during node creation"
        });
    }
};

// Update node (ADMIN only)
exports.updateNode = async (req, res) => {
    try {
        const {
            name,
            url,
            allowedRoles
        } = req.body;

        const updateData = {};

        if (name !== undefined) {
            updateData.name = name;
        }

        if (url !== undefined) {
            updateData.url = url;
        }

        if (allowedRoles !== undefined) {
            updateData.allowedRoles = allowedRoles;
        }

        const updatedNode =
            await Node.findOneAndUpdate(
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

        res.status(200).json({
            message: "Node updated successfully",
            updatedNode
        });

    } catch (err) {

        console.error("Error during node updation:", err);

        res.status(500).json({
            message: "Server error during node updation"
        });
    }
};

// Delete node (ADMIN only)
exports.deleteNode = async (req, res) => {
    try {
        const deletedNode = await Node.findOneAndDelete({
                    nodeId:req.params.nodeId
                });

        if (!deletedNode) {
            return res.status(404).json({
                message: "Node not found"
            });
        }

        res.status(200).json({
            message: "Node deleted successfully"
        });

    } 
    catch (err) {
        console.error("Error during node deletion:", err);
        res.status(500).json({
            message:"Server error during node deletion"
        });
    }
};

// Get navbar nodes after login
exports.getMyNodes = async (req, res) => {
    try {
        const roles = req.user.roles;

        const nodes = await Node.find({
            allowedRoles: { $in: roles }
        }).select("-_id -__v");

        res.status(200).json({
            nodes
        });

    } 
    catch (err) {
        console.error("Error fetching nodes:", err);
        res.status(500).json({
            message: "Server error while fetching nodes"
        });
    }
};