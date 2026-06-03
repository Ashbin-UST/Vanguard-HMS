const bcrypt = require("bcryptjs");

const generateHash = async () => {
  const passwordHash = await bcrypt.hash("Password@123", 10);
  console.log(passwordHash);
};

generateHash();