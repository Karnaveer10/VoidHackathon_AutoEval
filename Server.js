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

app.use('/api/student', require('./Routes/studentRouter'))
app.use('/api/prof', require('./Routes/profRouter'))
app.use('/api/external', require('./Routes/externalRouter'))
app.use('/api/register', require('./Routes/registerRouter'))

app.get("/", (req, res) => {
  res.send("API Working")
})

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
});*/


app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
