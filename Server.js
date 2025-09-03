const express = require('express');
const cors = require('cors')
require('dotenv').config()
const app = express();
app.use(express.json())
app.use(cors())
const router = express.Router();
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const connectDB = require('./config/dbConn')
const guide = require('./models/guideModel')
const port = process.env.PORT || 3000;
const profs = require('./models/profModel')
const Panel = require('./models/panelModel')
console.log("Panel:", Panel);

connectDB()

app.use('/api/student', require('./Routes/studentRouter'))
app.use('/api/prof', require('./Routes/profRouter'))
app.use('/api/external', require('./Routes/externalRouter'))
app.use('/api/register', require('./Routes/registerRouter'))
app.use('/api/upload', require('./Routes/uploadRouter'))

app.get("/", (req, res) => {
  res.send("API Working")
})
app.post("/panel_update", async (req, res) => {
  try {
    const { guideName, panel1, panel2 } = req.body;
        console.log("REQ BODY:", req.body);

    // 1. Find the guide by name
    const g = await guide.findOne({ name: guideName });
    if (!g) {
      return res.status(404).json({ message: "Guide not found" });
    }

    // Helper function to add guide to a panel
    const addGuideToPanel = async (panelName) => {
      if (!panelName) return null; // skip if no panelName provided

      let p = await Panel.findOne({ name: panelName });

      if (p) {
        // Panel exists → add guide if not already added
        if (!p.guides.includes(g._id)) {
          p.guides.push(g._id);
          await p.save();
        }
      } else {
        // Panel doesn’t exist → create new
        p = new Panel({
          panelId: new mongoose.Types.ObjectId().toString(), // unique id
          name: panelName,
          guides: [g._id],
        });
        await p.save();
      }

      return p;
    };

    // 2. Handle both panels
    const p1 = await addGuideToPanel(panel1);
    const p2 = await addGuideToPanel(panel2);

    return res.status(200).json({
      message: "Guide successfully added to panels",
      panels: [p1, p2].filter(Boolean), // remove nulls
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.get("/admin_get_teaminfo", async (req, res) => {

  try {
    const guides = await guide.find({});

    // Flatten into desired structure
    const result = [];

    guides.forEach(g => {
      g.acceptedTeams.forEach(team => {
        result.push({
          guideName: g.name,
          students: team.members.map(m => ({
            name: m.name,
            regno: m.regNo
          }))
        });
      });
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
app.get('/admin_get_profdata', async (req, res) => {
  try {
    const p = await profs.find();
    console.log(p)
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
})


// app.get('/getprofdata', async (req, res) => {
//   try {
//     const { profName } = req.query;

//     if (!profName) {
//       return res.status(400).json({ error: 'Missing profName in query' });
//     }

//     const professor = await guide.findOne({ name: profName });

//     if (!professor) {
//       return res.status(404).json({ error: 'Professor not found', requests: [] });
//     }

//     return res.status(200).json({ requests: professor.requests });
//   } catch (error) {
//     console.error('Error fetching professor data:', error);
//     return res.status(500).json({ error: 'Internal server error' });
//   }
// });
// app.post('/teamregistration', async (req, res) => {
//   try {
//     const { pid, members } = req.body;

//     console.log("Creating new master document with:", req.body);

//     const newMaster = new master({
//       pid,
//       requests: [{ members }] // wrap members inside a request
//     });

//     await newMaster.save();

//     res.status(201).json({ message: "New Master document created", data: newMaster });
//   } catch (err) {
//     console.error("Error in /teamregistration:", err);
//     res.status(500).json({ message: "Failed to create document", error: err.message });
//   }
// });
/*app.put('/rejectRequest', async (req, res) => {
  const { regNo, name } = req.body;

  try {
    const result = await master.updateOne(
      {
        name: name,
        "requests.members.regNo": regNo
      },
      {
        $pull: {
          requests: {
            "members.regNo": regNo
          }
        }
      }
    );

    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: "No matching request found to reject." });
    }

    res.json({ message: "Request rejected successfully." });
  } catch (err) {
    console.error("Error rejecting request:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});


/*app.put('/request-professor', async (req, res) => {
  const { regNo, pid, name } = req.body;

  if (!regNo || !pid || !name) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    // 1. Check if the professor already has a document
    const existingProfDoc = await master.findOne({ pid });

    if (!existingProfDoc) {
      // CASE 1: Professor doesn't exist, update student's doc
      const updated = await master.findOneAndUpdate(
        { 'requests.members.regNo': regNo },
        { $set: { pid, name } },
        { new: true }
      );

      if (!updated) {
        return res.status(404).json({ message: "No document found with that student regNo" });
      }

      return res.json({ message: "Professor assigned successfully", updated });
    } else {
      // CASE 2: Professor already has a doc — merge

      // Find the student's current master doc
      const studentDoc = await master.findOne({ 'requests.members.regNo': regNo });

      if (!studentDoc) {
        return res.status(404).json({ message: "Student document not found" });
      }

      // Transfer all requests to the professor's doc
      existingProfDoc.requests.push(...studentDoc.requests);

      // Save the updated professor doc
      await existingProfDoc.save();

      // Delete the old student doc
      await master.deleteOne({ _id: studentDoc._id });

      return res.json({
        message: "Student requests transferred to existing professor",
        updated: existingProfDoc
      });
    }
  } catch (err) {
    console.error("Error updating professor:", err);
    res.status(500).json({ message: "Server error" });
  }
});*/


// app.put('/acceptRequest', async (req, res) => {
//   const { regNo, name } = req.body;

//   if (!regNo || !name) {
//     return res.status(400).json({ message: "regNo and name are required." });
//   }

//   try {
//     // Find professor document by name
//     const professor = await master.findOne({ name });
//     if (!professor) {
//       return res.status(404).json({ message: "Professor not found." });
//     }

//     // Find the request containing the given regNo
//     const requestToAccept = professor.requests.find(req =>
//       req.members.some(member => member.regNo === regNo)
//     );

//     if (!requestToAccept) {
//       return res.status(404).json({ message: "No matching request found." });
//     }

//     const teamSize = requestToAccept.members.length;

//     if (professor.noOfSeats < teamSize) {
//       return res.status(400).json({ message: "Not enough seats available." });
//     }

//     // Accept team: clear requests, add to acceptedTeams, update seats
//     professor.requests = [];
//     professor.acceptedTeams.push({
//       members: requestToAccept.members,
//       acceptedAt: new Date()
//     });
//     professor.noOfSeats -= teamSize;

//     await professor.save();

//     res.status(200).json({
//       message: "Team accepted successfully.",
//       acceptedTeam: requestToAccept.members,
//       remainingSeats: professor.noOfSeats
//     });

//   } catch (error) {
//     console.error("acceptRequest error:", error);
//     res.status(500).json({ message: "Internal server error." });
//   }
// });


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
