const profModel = require('../models/profModel')
const guideModel = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const { get } = require('../Routes/profRouter')
const { getIo } = require("../utils/Socket.js");

const createToken = (pid) => {
    return jwt.sign({ pid }, process.env.JWT_TOKEN_SECRET, { expiresIn: "1h" });
};

const loginUser = async (req, res) => {
    const { pid, password } = req.body;

    try {
        const user = await profModel.findOne({ pid });
        if (!user)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid Email or Password" });

        const token = createToken(user.pid);

        // Set JWT as HttpOnly cookie
        res.cookie("token", token, {
            httpOnly: true,                                   // can't access via JS
            secure: process.env.NODE_ENV === "production",    // only HTTPS in prod
            sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
            maxAge: 30 * 60 * 1000                             // 30 minutes
        });

        res.status(200).json({ name: user.name });

    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Check your internet connection" });
    }
};


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
        const { pid } = req.user;

        const prof = await guideModel.findOne({ pid: pid });

        if (!prof) {
            return res.status(404).json({ message: 'Professor not found' });
        }

        res.status(200).json(prof);
    } catch (err) {
        console.error(err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
}
const acceptReq = async (req, res) => {
    try {
        const { id } = req.body;
        const { pid } = req.user;
        const io = getIo();


        if (!id) {
            return res.status(400).json({ message: "No team provided" });
        }

        const prof = await guideModel.findOne({ pid });

        if (!prof) {
            return res.status(404).json({ message: "Professor not found" });
        }

        const teamToAccept = prof.requests.find((team) => team._id.toString() === id);
        if (!teamToAccept) {
            return res.status(404).json({ message: "Team not found" });
        }
        console.log("Team to accept", teamToAccept)
        const len = teamToAccept.members?.length || 0;
        const initialSubmissions = ["Abstract", "Review 1", "Review 2", "Final Submission"].map((type) => ({
            type,
            status: "pending",
            files: [],
            remarks: "",
            marks: teamToAccept.members.map(member => ({
                regNo: member.regNo,
                name: member.name,
                score: 0
            }))
        }));

        prof.acceptedTeams.push({
            ...teamToAccept.toObject(),
            submissions: initialSubmissions
        });

        prof.requests = prof.requests.filter((team) => team._id.toString() !== id);
        prof.noOfSeats = prof.noOfSeats - len;


        teamToAccept.members.forEach(member => {
            io.to(member.regNo).emit("loadingupdate", {
                name: prof.name,
                members: teamToAccept.members,
                status: "accepted"
            });
        });
        io.emit("slotbookingupdate"); // sends to all connected clients

        await prof.save();

        res.json({ message: "Team accepted successfully", team: teamToAccept });
    }
    catch (err) {
        console.error("Error accepting team:", err);
        res.status(500).json({ message: "Server error" });
    }
};


const removeReq = async (req, res) => {
    try {
        const { id } = req.body;
        const { pid } = req.user;
        const io = getIo();

        console.log("Team to reject:", id);
        if (!id) {
            return res.status(400).json({ message: "No team provided" });
        }
        const prof = await guideModel.findOne({ pid });

        const teamToReject = prof.requests.find(team => team._id.toString() === id);
        if (!teamToReject) {
            return res.status(404).json({ message: "Team not found" });
        }
        await guideModel.updateOne(
            { pid: pid },
            { $pull: { requests: { _id: id } } }
        );
        teamToReject.members.forEach(member => {
            io.to(member.regNo).emit("requestedUpdate", {
                name: prof.name,
                members: teamToReject.members,
                status: "rejected"
            });
        });
        io.emit("slotbookingupdate"); // sends to all connected clients

        res.json({ message: "Team rejected successfully" });
    } catch (err) {
        console.error("Error rejecting team:", err);
        res.status(500).json({ message: "Server error" });
    }
}

const acceptedTeams = async (req, res) => {
    try {
        const { pid } = req.user;
        const prof = await guideModel.findOne({ pid: pid }).select('acceptedTeams name');

        if (!prof) {
            return res.status(404).json({ message: 'Professor not found' });
        }
        res.status(200).json({
            name: prof.name,
            acceptedTeams: prof.acceptedTeams,
            pid: pid
        });
    }
    catch (err) {
        console.error("Internal server errors", err);
        res.status(500).json({ message: "Server error" });
    }
};
const acceptSubmission = async (req, res) => {
    try {
        const io = getIo();
        const { marks, remarks, label } = req.body;
        const { pid } = req.user;

        const guideDoc = await guideModel.findOne({ pid });
        if (!guideDoc) return res.status(404).json({ message: "Guide not found" });

        // Loop over accepted teams
        guideDoc.acceptedTeams.forEach(team => {
            // Find the submission with matching label
            const submission = team.submissions.find(sub => sub.type === label);
            if (!submission) return;

            // Update marks
            submission.marks = submission.marks.map(m => {
                const newScore = marks.find(x => x.regNo === m.regNo)?.score;
                return newScore !== undefined ? { ...m, score: Number(newScore) } : m;
            });

            // Update remarks & status
            submission.remarks = remarks || submission.remarks;
            submission.status = "accepted";
        });

        await guideDoc.save();

        // Emit to students
        guideDoc.acceptedTeams.forEach(team => {
            team.members.forEach(member => io.to(member.regNo).emit("submissionupdate"));
        });

        res.status(200).json({ message: "Submission accepted successfully", guideDoc });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
};
const reSubmit = async (req, res) => {
    try {
        const { pid } = req.user;
        const io = getIo();
        const { marks, remarks, label } = req.body;

        // 1️⃣ Find the guide
        const guideDoc = await guideModel.findOne({ pid });
        if (!guideDoc) return res.status(404).json({ message: "Guide not found" });

        // 2️⃣ Loop over accepted teams
        guideDoc.acceptedTeams.forEach(team => {
            const submission = team.submissions.find(sub => sub.type === label);
            if (!submission) return;

            // 3️⃣ Merge marks while keeping student names
            submission.marks = submission.marks.map(m => {
                const newScore = marks.find(x => x.regNo === m.regNo)?.score;
                return newScore !== undefined ? { ...m, score: Number(newScore) } : m;
            });

            // 4️⃣ Reset files, set status, update remarks
            submission.files = [];
            submission.status = "resubmit";
            submission.remarks = remarks || submission.remarks;
        });

        // 5️⃣ Save the doc
        await guideDoc.save();

        // 6️⃣ Emit to all team members
        guideDoc.acceptedTeams.forEach(team => {
            team.members.forEach(member => io.to(member.regNo).emit("submissionupdate"));
        });

        res.status(200).json({ message: "Submission sent for resubmission successfully", guideDoc });

    } catch (error) {
        console.error("Error in reSubmit:", error);
        res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = { loginUser, getinfo, getprof, acceptReq, removeReq, acceptedTeams, acceptSubmission, reSubmit };   
