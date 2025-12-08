const profModel = require('../models/profModel')
const guideModel = require('../models/guideModel')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const validator = require('validator')
const { get } = require('../Routes/profRouter')
const { getIo } = require("../utils/Socket.js");
const panelModel = require("../models/panelModel")
const Message = require("../models/messageModel")
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

        if (prof.noOfSeats < len) {
            return res.status(400).json({ message: "Not enough seats available" });
        }


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
const getPanel = async (req, res) => {
    try {
        const { pid } = req.user;
        const panel = await panelModel.findOne({ pid }); // <--- add await

        if (!panel) {
            return res.status(404).json({ message: "Panel not found" });
        }
        const guideData = await Promise.all(
            panel.guides.map(g => guideModel.findOne({ pid: g }))
        );

        res.status(200).json({ guides: guideData })
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
const getTeamID = async (req, res) => {
    try {
        const { id } = req.body; // get id from frontend
        console.log(id)
        if (!id) {
            return res.status(400).json({ message: "id is required" });
        }

        // Find the guide whose acceptedTeams contains this id
        const guide = await guideModel.findOne({
            "acceptedTeams._id": id
        });

        if (!guide) {
            return res.status(404).json({ message: "Team not found" });
        }

        // Find the exact team from acceptedTeams
        const team = guide.acceptedTeams.find(t => t._id.toString() === id);

        res.status(200).json({ guideId: guide._id, guideName: guide.name, team });
    } catch (error) {
        console.error("Error fetching team:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};


const panelMarks = async (req, res) => {
    try {
        console.log("Request body:", req.body);
        const panelMarksData = req.body.panelMarks; // { "Review 1": { marks: {...} } }

        console.log("Received panel marks:", panelMarksData);

        const reviewType = Object.keys(panelMarksData)[0];
        const marks = panelMarksData[reviewType].marks;

        console.log("Review Type:", reviewType);
        console.log("Marks Object:", marks);

        if (!marks) {
            console.log("Marks is undefined or null!");
            return res.status(400).json({ message: "Marks not provided in body" });
        }

        const { pid } = req.user;
        console.log("PID from user:", pid);

        const panelDoc = await panelModel.findOne({ pid });
        console.log("Panel doc found:", panelDoc ? true : false);

        if (!panelDoc) return res.status(404).json({ message: "Panel not found" });

        // Take the first regNo from the body
        const firstRegNo = Object.keys(marks)[0];
        console.log("First regNo from body:", firstRegNo);

        // Find the team object which contains this member in members
        const teamObj = panelDoc.marks.find(team =>
            team.teams.some(review =>
                review.members.some(member => member.regNo === firstRegNo)
            )
        );

        console.log("Team object found:", teamObj ? true : false);

        if (!teamObj) {
            console.log("No team contains this member");
            return res.status(404).json({ message: "Member not found in any team" });
        }

        // Find the review object with the given type
        const reviewObj = teamObj.teams.find(r => r.type === reviewType);
        console.log("Review object found:", reviewObj ? true : false);

        if (!reviewObj) {
            console.log("No review of this type found in the team");
            return res.status(404).json({ message: "Review type not found" });
        }

        // Update scores for all members in this review
        reviewObj.members.forEach(member => {
            if (marks[member.regNo] !== undefined) {
                member.score = Number(marks[member.regNo]);
            }
        });

        await panelDoc.save();
        console.log("Updated scores successfully!");
        res.status(200).json({ message: "Scores updated successfully", updatedReview: reviewObj });

    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ message: "Internal server error", error });
    }
};
const getPanelMarks = async (req, res) => {
    try {
        const { matchedTeam } = req.body;
        if (!matchedTeam || !matchedTeam.members || matchedTeam.members.length === 0) {
            return res.status(400).json({ message: "Invalid matchedTeam data" });
        }
        console.log("Recieved data",matchedTeam)
        // Step 1: Get the first member’s regNo
        const firstRegNo = matchedTeam.members[0].regNo;
        console.log("First member regNo:", firstRegNo);

        // Step 2: Get the logged-in panel PID
        const { pid } = req.user;
        console.log("Panel PID:", pid);

        // Step 3: Find the panel document
        const panelDoc = await panelModel.findOne({ pid });
        if (!panelDoc) return res.status(404).json({ message: "Panel not found" });

        // Step 4: Find the object that contains this regNo
        const teamObj = panelDoc.marks.find(team =>
            team.teams.some(review =>
                review.members.some(member => member.regNo === firstRegNo)
            )
        );
        if (!teamObj)
            return res.status(404).json({ message: "No matching team found in panel" });

        // Step 5: Extract reviews
        const reviewsData = teamObj.teams.map(r => ({
            type: r.type,
            marks: r.members.map(m => ({
                regNo: m.regNo,
                name: m.name,
                score: m.score,
            })),
          
        }));

        // Step 6: Send response
        res.status(200).json({profname:panelDoc.name, reviews: reviewsData });
    } catch (err) {
        console.error("Error in getPanelMarks:", err);
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
};
const sendMessage = async (req, res) => {
    try {
        const {fromName, members, message } = req.body;
        const {pid} = req.user
        console.log(pid,fromName,members,message)
        const regNos = members.map(m => m.regNo).sort();
        const m = await Message.findOne({
            from: pid,
            to: regNos
        });
         const io = getIo();
        console.log(fromName)
        if (m) {
            m.messages.push({
                text: message,
                timestamp: Date.now()
            });

            await m.save();
        } else {
            await Message.create({
                from: pid,
                fromName:fromName,
                to: regNos,
                messages: [
                    {
                        text: message,
                        timestamp: Date.now()
                    }
                ]
            });
        }
          members.forEach(member => {
            io.to(member.regNo).emit("newMessage", {
                fromName: fromName,
                message: message,
                timestamp: Date.now()
            });
        });

        return res.status(201).json({ success: true, msg: "Message sent!" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, msg: "Server error" });
    }
};

const getMessages = async (req, res) => {
    try {
        const { members } = req.body;

        // Extract regNos only
        const regNos = members.map(m => m.regNo).sort();

        // Find ALL messages matching this membership
        const chats = await Message.find({ to: regNos });

        if (chats.length > 0) {
            return res.status(200).json({
                success: true,
                chats: chats.map(chat => ({
                    fromName: chat.fromName,
                    messages: chat.messages
                }))
            });
        }

        return res.status(200).json({
            success: true,
            chats: []
        });

    } catch (err) {
        console.error("Error fetching messages:", err);
        return res.status(500).json({
            success: false,
            chats: [],
            error: "Server Error"
        });
    }
};




module.exports = { loginUser, getinfo, getprof, acceptReq, removeReq, acceptedTeams, acceptSubmission, reSubmit, getPanel, getTeamID, panelMarks, getPanelMarks,sendMessage, getMessages };   
