const profModel = require('../models/profModel')
const guideModel = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const createToken = (id)=>{
    return jwt.sign( {id}, process.env.JWT_TOKEN_SECRET)
}

const loginUser = async(req,res)=>{
    const {id,password} = req.body;

    try {
        const user = await profModel.findOne({id})
        if(!user)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const token = createToken(user._id)
        res.status(200).json({ token, name: user.name });
    } catch (error) {
        console.log(error)
        res.status(500).json({"message":"Internal Server Error"}) 
    }
}

const getinfo = async (req, res) => {
    try {
        const guides = await guideModel.find();
        res.status(200).json(guides);
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal Server Error" });
    }
}

module.exports = { loginUser, getinfo };   
