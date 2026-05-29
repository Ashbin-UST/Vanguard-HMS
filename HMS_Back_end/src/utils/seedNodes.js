/**
 * Seed default sidebar nodes.
 *
 * Run manually:  node src/utils/seedNodes.js
 *
 * The frontend always renders "Overview" and "Profile" by itself, so they
 * are intentionally NOT seeded here. This script only inserts the
 * role-specific menu items. Re-running is safe: existing paths are skipped.
 */
require("dotenv").config();
const mongoose = require("mongoose");
const Node = require("../models/Nodes");

const DEFAULT_NODES = [
    // --- Employee management (OWNER, ADMIN) ---
    {
        name: "Employees",
        path: "/dashboard/employees",
        icon: "users",
        allowedDesignations: ["OWNER", "ADMIN"]
    },
    {
        name: "Approvals",
        path: "/dashboard/approvals",
        icon: "check-circle",
        allowedDesignations: ["OWNER", "ADMIN"]
    },
    {
        name: "Create Employee",
        path: "/dashboard/employees/create",
        icon: "user-plus",
        allowedDesignations: ["OWNER", "ADMIN"]
    },

    // --- Admin management (OWNER only) ---
    {
        name: "Admins",
        path: "/dashboard/admins",
        icon: "shield",
        allowedDesignations: ["OWNER"]
    },

    // --- Patients (OWNER, ADMIN, RECEPTIONIST) ---
    {
        name: "Patients",
        path: "/dashboard/patients",
        icon: "user",
        allowedDesignations: ["OWNER", "ADMIN", "RECEPTIONIST"]
    },
    {
        name: "Add Patient",
        path: "/dashboard/patients/create",
        icon: "user-plus",
        allowedDesignations: ["OWNER", "ADMIN", "RECEPTIONIST"]
    },

    // --- Appointments ---
    // Reception level can view + book
    {
        name: "Appointments",
        path: "/dashboard/appointments",
        icon: "calendar",
        allowedDesignations: ["OWNER", "ADMIN", "RECEPTIONIST", "DOCTOR"]
    },
    {
        name: "Book Appointment",
        path: "/dashboard/appointments/book",
        icon: "calendar-plus",
        allowedDesignations: ["OWNER", "ADMIN", "RECEPTIONIST"]
    }
];

const seedNodes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected for seeding");

        let created = 0;
        let skipped = 0;

        for (const nodeData of DEFAULT_NODES) {
            const existing = await Node.findOne({ path: nodeData.path });

            if (existing) {
                skipped += 1;
                console.log(`Skipped (exists): ${nodeData.path}`);
                continue;
            }

            // Use save() so the pre-save hook assigns nodeId
            const node = new Node(nodeData);
            await node.save();
            created += 1;
            console.log(`Created: ${node.nodeId} -> ${node.path}`);
        }

        console.log(`\nSeeding complete. Created: ${created}, Skipped: ${skipped}`);
    } catch (err) {
        console.error("Seeding error:", err);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected");
        process.exit(0);
    }
};

seedNodes();
