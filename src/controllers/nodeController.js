const Node = require("../models/NodeModel");

const createNode = async (req,res)=>{
    try{
    const name = req.body.name;//
            const existingNode= await Node.findOne({name});
            if(existingNode)
            return res.status(409).json({"message":"Node already registered"});

    const node= new Node(req.body);
    const savedNode = await node.save();
    return res.status(201).json({savedNode});
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }
    
} 

const deleteNode = async (req,res)=>{
    try{
    await Node.findOneAndDelete({
        name:req.params.name
    });
    return res.status(200).json({message: "delted successfully"});
    }
    catch(err){
       res.status(500).json({ message: err.message }); 
    }

}

module.exports = {createNode,deleteNode}