const profModel = require('../models/profModel')
const guideModel = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const createToken = (pid)=>{
    return jwt.sign( {id:pid}, process.env.JWT_TOKEN_SECRET, { expiresIn: "1h" } )
}

const loginUser = async(req,res)=>{
    const {pid,password} = req.body;

    try {
        const user = await profModel.findOne({pid})
        if(!user)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const isMatch = await bcrypt.compare(password,user.password)
        if(!isMatch)
            return res.status(400).json({"message":"Invalid Email or Password"})
        const token = createToken(user.pid)
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

const getprof = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(400).json({ message: 'Token missing or invalid format' });
        }

        const token = authHeader.split(" ")[1];
        console.log("Token received:", token);

        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET); 
        console.log("Decoded payload:", decoded);
        console.log("Looking for ID:", decoded.id);

        const prof = await guideModel.findOne({pid:decoded.id}).select('requests');

        if (!prof) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        res.status(200).json(prof.requests);
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

module.exports = { loginUser, getinfo , getprof };   
