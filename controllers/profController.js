const profModel = require('../models/profModel')
const guideModel = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const { get } = require('../Routes/profRouter')
const createToken = (pid)=>{
    return jwt.sign( {pid}, process.env.JWT_TOKEN_SECRET, { expiresIn: "1h" } )
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
        const token = createToken(user.pid);
        res.status(200).json({ token, name: user.name });
    } catch (error) {
        console.log(error)
        res.status(500).json({"message":"Internal Server Error"}) 
    }
}

const getinfo = async(req, res) => {
    try {
        const guides = await guideModel.find();
        res.status(200).json(guides);
    } catch (error) {
        console.log(error);
        res.status(500).json({ "message": "Internal Server Error" });
    }
}

const getprof = async(req, res) => {
    try {
        const {pid} = req.user;

        const prof = await guideModel.findOne({pid:pid}).select('requests');

        if (!prof) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        res.status(200).json(prof.requests);
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}

const acceptReq = async (req, res) => {
  try {
    const { id } = req.body;
    const { pid } = req.user; 

    if (!id){
        return res.status(400).json({ message: "No team provided" });
    } 

    const prof = await guideModel.findOne({ pid });

    if (!prof){ 
        return res.status(404).json({ message: "Professor not found" });
    }
    
    const teamToAccept = prof.requests.find((team) => team._id.toString() === id);
    if (!teamToAccept){
        return res.status(404).json({ message: "Team not found" });
    }

    const len = teamToAccept.members?.length;

    prof.acceptedTeams.push(teamToAccept);

    prof.requests = prof.requests.filter((team) => team._id.toString() !== id);
    
    prof.noOfSeats = prof.noOfSeats - len;

    await prof.save();

    res.json({ message: "Team accepted successfully", team: teamToAccept });
  } 
  catch (err) {
    console.error("Error accepting team:", err);
    res.status(500).json({ message: "Server error" });
  }
};


const removeReq = async(req, res) => {
    try {
    const { id } = req.body;
    const { pid } = req.user;
    console.log("Team to reject:", id);
    if (!id) {
      return res.status(400).json({ message: "No team provided" });
    }

    await guideModel.updateOne(
      { pid: pid },
      { $pull: { requests: { _id : id } } }
    );

    res.json({ message: "Team rejected successfully" });
  } catch (err) {
    console.error("Error rejecting team:", err);
    res.status(500).json({ message: "Server error" });
  }
}

const acceptedTeams = async(req, res) =>{
    try {
        const {pid} = req.user;
        const prof = await guideModel.findOne({pid:pid}).select('acceptedTeams name');

        if (!prof) {
            return res.status(404).json({ message: 'Professor not found' });
        }   
        res.status(200).json({ 
            name: prof.name,
            acceptedTeams:prof.acceptedTeams
        });
    } 
    catch (err){
        console.error("Internal server errors", err);
        res.status(500).json({ message: "Server error" });
    }
};  

module.exports = { loginUser, getinfo , getprof , acceptReq , removeReq , acceptedTeams };   
