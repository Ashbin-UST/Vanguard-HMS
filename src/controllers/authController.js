const bcrypt = require('bcryptjs');
const User = require('../models/userModel');
const Employee = require('../models/employeeModel');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/generateToken');

const buildTokenPayload = (user) => ({
  id: user._id,
  userId: user.userId,
  email: user.email,
  roles: user.roles,
  status: user.status,
  employeeId: user.employeeId || null,
});


const VALID_ROLES = [
  'OWNER', 'ADMIN', 'DOCTOR', 'RECEPTIONIST',
  'CASHIER', 'NURSE', 'LAB_TECH', 'PHARMACIST',
];

const normalizeAndValidateRoles = (roles) => {
  const rolesArray = Array.isArray(roles) ? roles : [roles];

  const invalidRoles = rolesArray.filter(r => !VALID_ROLES.includes(r));
  if (invalidRoles.length) {
    return res.status(409).json({
      status: 400,
      message: `Invalid roles: [${invalidRoles.join(', ')}]. Valid: [${VALID_ROLES.join(', ')}]`,
    });
  }

  return rolesArray;
};

const validateEmployeeForRoles = async (roles, employeeId) => {
  const isOwnerOnly = roles.every(r => r === 'OWNER');
  if (isOwnerOnly) return null;

  if (!employeeId) {
    return res.status(409).json({
      status: 400,
      message: `employeeId is required for roles: [${roles.join(', ')}]`,
    });
  }

  const employee = await Employee.findById(employeeId);
  if (!employee) {
    return res.status(404).json({
      status: 404,
      message: `Employee not found with ID: ${employeeId}`,
    });
  }

  if (employee.status === 'INACTIVE') {
    return res.status(400).json({
      status: 400,
      message: `Employee "${employee.name}" is INACTIVE. Cannot create account`,
    });
  }

  const existingEmployeeUser = await User.findOne({ employeeId });
  if (existingEmployeeUser) {
    return res.status(409).json({
      status: 409,
      message: `Employee already has a user account: ${existingEmployeeUser.email}`,
    });
  }

  return employeeId;
};

const validateRegisterInput = ({ email, password, roles }) => {
  if (!email || !password || !roles) {
    return res.status(400).json({
      status: 400,
      message: 'email, password, and roles are required',
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      status: 400,
      message: 'Password must be at least 8 characters',
    });
  }
};

const register = async (req, res) => {
  try {
    const { email, password, roles, employeeId, status } = req.body;

    validateRegisterInput({ email, password, roles });

    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: `User with email "${email}" already exists`,
      });
    }

    const rolesArray = normalizeAndValidateRoles(roles);

    const validatedEmployeeId = await validateEmployeeForRoles(
      rolesArray,
      employeeId
    );

    const passwordHash = await bcrypt.hash(
      password,
      await bcrypt.genSalt(12)
    );

    const savedUser = await new User({
      email: normalizedEmail,
      passwordHash,
      roles: rolesArray,
      employeeId: validatedEmployeeId,
      status: status || 'ACTIVE',
    }).save();

    const populated = await User.findById(savedUser._id).populate(
      'employeeId',
      'employeeCode name designation department email phone'
    );

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        userId: populated.userId,
        email: populated.email,
        roles: populated.roles,
        status: populated.status,
        employee: populated.employeeId || null,
        createdAt: populated.createdAt,
      },
    });

  } catch (error) {
    console.log('register error:', error);

    if (error.status) {
      return res
        .status(error.status)
        .json({ success: false, message: error.message });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(e => e.message);
      return res
        .status(400)
        .json({ success: false, message: messages.join(', ') });
    }

    return res
      .status(500)
      .json({ success: false, message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'email and password are required',
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
    })
      .select('+passwordHash +refreshToken')
      .populate(
        'employeeId',
        'employeeCode name designation department email phone'
      );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({
        success: false,
        message: 'Your account is INACTIVE. Contact administrator',
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }


    const payload = buildTokenPayload(user);
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ id: user._id });

    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        status: user.status,
        employee: user.employeeId || null,
        lastLoginAt: user.lastLoginAt,
        tokens: {
          accessToken,
          refreshToken,
        },
      },
    });
  } catch (error) {
    console.log("login error: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate(
      'employeeId',
      'employeeCode name designation department email phone specialization',
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "User Profile: ",
      data: {
        userId: user.userId,
        email: user.email,
        roles: user.roles,
        status: user.status,
        employee: user.employeeId || null,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt,
      },
    });
  }
  catch(error) {
    console.log("Get User profile error: ", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


module.exports = {
  register,
  login,
  getMe,
};