const userModel = require('../models/guideModel')
const createToken = (id)=>{
    return jwt.sign( {id}, process.env.JWT_TOKEN_SECRET)
}

const register = async(req,res) =>{
    const { members, pid } = req.body;

    if (!members || !pid) {
        return res.status(400).json({ message: "Members and professor id are required" });
    }

    try {
        console.log("Incoming members:", members);
        const updatedProf = await userModel.findOneAndUpdate(
            { pid },
            {
                $push: {
                    requests: {
                        members: members, // array of member objects
                        isAccepted: false,
                        requestedAt: new Date()
                    }
                }
            },
            { new: true }
        );

        if (!updatedProf) {
            return res.status(404).json({ message: "Professor not found" });
        }

        res.status(200).json({ message: "Members added successfully", updatedProf });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error",error });
    }
};

module.exports = {register}; 