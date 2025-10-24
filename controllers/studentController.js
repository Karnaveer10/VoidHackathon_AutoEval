const userModel = require('../models/studentModel')
const guide = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const { getIo } = require("../utils/Socket.js");

const createToken = (regno) => {
    return jwt.sign({ regno }, process.env.JWT_TOKEN_SECRET, { expiresIn: "30m" })
}
const setIo = (socketIo) => {
    io = socketIo;
};

const loginUser = async (req, res) => {
  const { regno, password } = req.body;

    try {
        const user = await userModel.findOne({ regno });

        if (!user)
            return res.status(400).json({ message: "Invalid Registration number or Password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid Registration number or Password" });

        const token = createToken(user.regno);

        // Set JWT as HttpOnly cookie for students as well
        res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 30 * 60 * 1000 // 30 minutes
        });

        let guideDoc = await guide.findOne({
            "acceptedTeams.members.regNo": regno
        });

      if (guideDoc) {
        return res.status(200).json({
          status: "accepted",
          guide: guideDoc.name   // professor name
        });
      }

      guideDoc = await guide.findOne({
          "requests.members.regNo": regno
      });
      console.log("requested", guideDoc)

      if (guideDoc) {
        return res.status(200).json({
          status: "requested",
          guide: guideDoc.name   // professor name
        });
      }
      console.log("requested", guideDoc)

      // ✅ If not found anywhere
      return res.status(200).json({
        status: "notregistered"
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
            members: team.members || []
        };
        res.status(200).json(guideData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

const getRequestedData = async (req, res) => {
  try {
    const { regno } = req.user; // student regno
    const io = getIo()
    // --- Check if student is still in requests ---
    let guideDoc = await guide.findOne({
      "requests.members.regNo": regno
    }).lean();

    if (guideDoc) {
      const requestTeam = guideDoc.requests.find(req =>
        req.members.some(member => member.regNo === regno)
      );

      if (requestTeam) {
        const guideData = {
          name: guideDoc.name,
          members: requestTeam.members || [],
          status: "requested"
        };

        io.to(regno).emit("requestedUpdate", guideData);
        return res.status(200).json(guideData);
      }
    }

    // --- If not in requests, check acceptedTeams ---
    guideDoc = await guide.findOne({
      "acceptedTeams.members.regNo": regno
    }).lean();

    if (guideDoc) {
      const acceptedTeam = guideDoc.acceptedTeams.find(team =>
        team.members.some(member => member.regNo === regno)
      );

      if (acceptedTeam) {
        const guideData = {
          name: guideDoc.name,
          members: acceptedTeam.members || [],
          status: "accepted"
        };

        io.to(regno).emit("requestedUpdate", guideData);
        return res.status(200).json(guideData);
      }
    }

    // --- Not found anywhere ---
    return res.status(404).json({ message: "Team not found" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getName = async (req, res) => {
  try {
    const { regno } = req.body;
    const student = await userModel.findOne({ regno: regno });

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.json({ name: student.name });
  } catch (err) {
    console.error("Error fetching name:", err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports = { loginUser, getInfo, getRegData, getRequestedData, getName };