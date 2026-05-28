const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
require('dotenv').config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB connected');

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@hospital.com';
        const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            console.log('  Admin user already exists');
            process.exit(0);
        }

        // Create admin user
        const passwordHash = await bcrypt.hash(adminPassword, await bcrypt.genSalt(12));

        const admin = await new User({
            email: adminEmail,
            passwordHash,
            roles: ['ADMIN'],
            status: 'ACTIVE',
            approvalStatus: 'APPROVED',
            employeeId: null, // Admin doesn't need employee record
        }).save();
        process.exit(0);
    } catch (error) {
        console.error(' Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();