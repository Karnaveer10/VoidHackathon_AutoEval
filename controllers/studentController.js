const userModel = require('../models/studentModel')
const guide = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const createToken = (regno) => {
    return jwt.sign({ regno }, process.env.JWT_TOKEN_SECRET, { expiresIn: "30m" })
}

const loginUser = async (req, res) => {
    const { regno, password } = req.body;

    try {
        const user = await userModel.findOne({ regno });

        if (!user)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const token = createToken(user.regno);

        let guideDoc = await guide.findOne({
            "acceptedTeams.members.regNo": regno
        });

        if (guideDoc) {
            return res.status(200).json({
                token,
                status: "accepted",
                guide: guideDoc.name   // professor name
            });
        }

        guideDoc = await guide.findOne({
            "requests.members.regNo": regno
        });

        if (guideDoc) {
            return res.status(200).json({
                token,
                status: "requested",
                guide: guideDoc.name   // professor name
            });
        }

        // ✅ If not found anywhere
        return res.status(200).json({
            token,
            status: "notRegistered"
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};


const getInfo = async (req, res) => {
    try {
        const { regno } = req.user;

        const student = await userModel.findOne({ regno: regno }).select('-password -role -_id -email');

        if (!student) {
            return res.status(404).json({ message: 'Student not found' });
        }

        res.status(200).json(student);
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

const getRegData = async (req, res) => {
  try {
    const { regno } = req.user;

    const guideDoc = await guide.findOne({ "acceptedTeams.members.regNo": regno }).lean();

    if (!guideDoc || !guideDoc.acceptedTeams || guideDoc.acceptedTeams.length === 0) {
      return res.status(404).json({ message: "Accepted team not found" });
    }

    const team = guideDoc.acceptedTeams[0]; // Only one accepted team

    const guideData = {
      name: guideDoc.name,
      submissions: team.submissions || [],
      members : team.members || []
    };
    res.status(200).json(guideData);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};






module.exports = { loginUser, getInfo, getRegData };