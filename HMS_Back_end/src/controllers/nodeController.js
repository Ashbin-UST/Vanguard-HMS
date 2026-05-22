const Node = require("../models/Node");


exports.getNodesByRole = async (req, res) => {
  try {
    const role = req.query.role;
    // console.log("Received request for nodes with role:", role);



    const nodes = await Node.find({
      roles: { $in: [role] },
      isActive: true
    }).sort({ order: 1 });
    // console.log("Fetched nodes for role:", role, nodes);
    res.json(nodes);
  } catch (err) {
    res.status(500).json({
      message: "Error fetching nodes",
      error: err.message
    });
  }
};

    // add data to node to see if it is working
exports.createNodes = async (req, res) => {
  try {
    const nodes = [
      {
        url: "overview",
        identifier: "overview",
        name: "Overview",
        logo: "⊞",
        order: 1,
        isActive: true,
        roles: ["OWNER", "ADMIN", "DOCTOR"] 
      },
      {
        url: "employees",
        identifier: "employees",
        name: "Employees",
        logo: "👥",
        order: 2,
        isActive: true,
        roles: ["OWNER", "ADMIN"] 
      },
      {
        url: "activity",
        identifier: "activity",
        name: "Activity",
        logo: "📋",
        order: 3,
        isActive: true,
        roles: ["OWNER", "ADMIN"] 
      },
      {
        url: "requests",
        identifier: "requests",
        name: "Requests",
        logo: "🔔",
        order: 4,
        isActive: true,
        roles: ["OWNER", "ADMIN", "RECEPTIONIST"] 
      }
    ];

    await Node.insertMany(nodes);

    return res.status(201).json({
      message: "Nodes inserted successfully"
    });

  } catch (error) {
    return res.status(500).json({
      message: error.message
    });
  }
};