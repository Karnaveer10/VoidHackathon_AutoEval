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

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
