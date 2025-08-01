const express = require('express');
const cors = require('cors')
require('dotenv').config()
const app = express();
app.use(express.json())
app.use(cors())

const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const connectDB = require('./config/dbConn')
const master = require('./models/guideModel')
const port = process.env.PORT || 3000;
const profs = require('./models/profModel')

connectDB()
const fs = require('fs');
const profDataPath = path.join(__dirname, 'profData.json');
fs.readFile(profDataPath, 'utf8', async (err, data) => {
  if (err) {
    console.error("Error reading profData.json:", err);
    return;
  }

  try {
    const profArray = JSON.parse(data);

    for (const prof of profArray) {
      const exists = await master.findOne({ pid: prof.id });

      if (!exists) {
        const newDoc = new master({
          pid: prof.id,
          name: prof.name,
          cabinNo: `CAB-${prof.id}`,
          noOfSeats: 3,
          requests: [],
          acceptedTeams: []
        });

        await newDoc.save();
        console.log(`✅ Inserted ${prof.name}`);
      } else {
        console.log(`⏭️ Skipped (already exists): ${prof.name}`);
      }
    }
  } catch (e) {
    console.error("Error parsing/inserting profData:", e.message);
  }
});
app.use('/api/student', require('./Routes/studentRouter'))
app.use('/api/prof', require('./Routes/profRouter'))
app.use('/api/external', require('./Routes/externalRouter'))

app.get("/", (req, res) => {
  res.send("API Working")
})
app.post('/teamregistration', async (req, res) => {
  try {
    const { pid, members } = req.body;

    console.log("Creating new master document with:", req.body);

    const newMaster = new master({
      pid,
      requests: [{ members }] // wrap members inside a request
    });

    await newMaster.save();

    res.status(201).json({ message: "New Master document created", data: newMaster });
  } catch (err) {
    console.error("Error in /teamregistration:", err);
    res.status(500).json({ message: "Failed to create document", error: err.message });
  }
});
app.put('/rejectRequest', async (req, res) => {
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

app.get('/getprofdata', async (req, res) => {
  try {
    // Fetch all professors
    const allProfs = await profs.find({});

    // Create result array
    const enrichedProfs = await Promise.all(
      allProfs.map(async (prof) => {
        // Try to find a matching master document with same pid and name
        const masterDoc = await master.findOne({
          pid: prof.id,
          name: prof.name
        });

        // Log match status
        console.log(`Checking prof: ${prof.name} (ID: ${prof.id})`);
        if (masterDoc) {
          console.log("✅ Matching masterDoc found:", masterDoc);
        } else {
          console.log("❌ No matching masterDoc found.");
        }

        // Add noOfSeats to prof (from master or default 3)
        return {
          ...prof.toObject(),
          noOfSeats: masterDoc?.noOfSeats ?? 3
        };
      })
    );

    res.json(enrichedProfs);
  } catch (error) {
    console.error("Error fetching prof data:", error);
    res.status(500).send("Server error");
  }
});

app.get('/getmasterdata', async (req, res) => {
  try {
    const name = req.query.profName;
    if (!name) {
      return res.status(400).json({ error: "Missing 'profName' query parameter" });
    }

    const data = await master.findOne({ name });

    if (!data) {
      return res.status(404).json({ error: "No professor found with that name" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error fetching prof data:", error);
    res.status(500).send("Server error");
  }
});

app.put('/request-professor', async (req, res) => {
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
});

app.put('/acceptRequest', async (req, res) => {
  const { regNo, name } = req.body;

  if (!regNo || !name) {
    return res.status(400).json({ message: "regNo and name are required." });
  }

  try {
    // Find professor document by name
    const professor = await master.findOne({ name });
    if (!professor) {
      return res.status(404).json({ message: "Professor not found." });
    }

    // Find the request containing the given regNo
    const requestToAccept = professor.requests.find(req =>
      req.members.some(member => member.regNo === regNo)
    );

    if (!requestToAccept) {
      return res.status(404).json({ message: "No matching request found." });
    }

    const teamSize = requestToAccept.members.length;

    if (professor.noOfSeats < teamSize) {
      return res.status(400).json({ message: "Not enough seats available." });
    }

    // Accept team: clear requests, add to acceptedTeams, update seats
    professor.requests = [];
    professor.acceptedTeams.push({
      members: requestToAccept.members,
      acceptedAt: new Date()
    });
    professor.noOfSeats -= teamSize;

    await professor.save();

    res.status(200).json({
      message: "Team accepted successfully.",
      acceptedTeam: requestToAccept.members,
      remainingSeats: professor.noOfSeats
    });

  } catch (error) {
    console.error("acceptRequest error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
