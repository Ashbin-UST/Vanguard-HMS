const authorizeAdmin = (req,res,next)=>{
    if(req.user.role!=='ADMIN'){
        return res.status(409).json({"message":"Access Denied"})
    }
    next();
};

module.exports=authorizeAdmin;