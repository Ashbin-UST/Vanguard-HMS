const User = require("../models/Users");
const Employee = require("../models/Employees");

// Deletes both the Employee record and the linked User account
async function deleteEmployeeAccount(employeeCode) {
  await Promise.all([
    Employee.deleteOne({ employeeCode }),
    User.deleteOne({ employeeCode }),
  ]);
}

module.exports = deleteEmployeeAccount;