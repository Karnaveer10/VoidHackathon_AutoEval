const userModel = require('../models/guideModel')
const validator = require('validator')
const createToken = (id)=>{
    return jwt.sign( {id}, process.env.JWT_TOKEN_SECRET)
}

const individual = async(req,res)=>{
    const {regno,password} = req.body;  

    try {
        const user = await userModel.findOne({regno})
        if(!user)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const token = createToken(user._id)
        res.status(200).json({token})
    } catch (error) {
        console.log(error)
        res.status(500).json({"message":"Internal Server Error"}) 
    }
}

const team = async(req,res)=>{

    try{
        const {token} = req.body
        if(!token){
            res.status(400).json({message: 'Token missing'})
            return
        }
            
        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

        const student = await userModel.findById(decoded.id).select('-password -role -_id');

        if (!student) {
        return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student)
    }
    catch(err){
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = {individual,team};