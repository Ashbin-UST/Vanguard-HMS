const express = require("express");
const router  = express.Router(); 

const auth = require("../middlewares/authMiddleware")
const authorizeAdmin = require("../middlewares/authorizeAdmin")

const {createNode,deleteNode} = require("../controllers/nodeController")

router.post("/",auth,authorizeAdmin,createNode);
router.delete("/:name",auth,authorizeAdmin,deleteNode); 

module.exports = router;

