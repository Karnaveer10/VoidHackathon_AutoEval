// server.js
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const http = require('http');
const { initSocket } = require("./utils/Socket.js");

// Models
const guide = require('./models/guideModel');
const profs = require('./models/profModel');
const Panel = require('./models/panelModel');

// Utils
const { checkSubmissions } = require('./utils/slaAgent');

// Connect to DB
const connectDB = require('./config/dbConn');
connectDB();

const app = express();
app.use(express.json());

// Allow frontend origin and enable credentials for cookies
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(cookieParser());

// Routes
app.use('/api/student', require('./Routes/studentRouter'));
app.use('/api/prof', require('./Routes/profRouter'));
app.use('/api/external', require('./Routes/externalRouter'));
app.use('/api/register', require('./Routes/registerRouter'));
app.use('/api/upload', require('./Routes/uploadRouter'));
app.use('/api/logout', require('./Routes/logoutRouter'));

// Create server & socket.io
const server = http.createServer(app);
const io = initSocket(server);

// Panel update route
app.post("/panel_update", async (req, res) => {
  try {
    const { guideName, panel1, panel2 } = req.body;
    console.log("REQ BODY:", req.body);

    const g = await guide.findOne({ name: guideName });
    if (!g) return res.status(404).json({ message: "Guide not found" });

    const addGuideToPanel = async (panelName) => {
      if (!panelName) return null;

      let p = await Panel.findOne({ name: panelName });
      if (p) {
        if (!p.guides.includes(g._id)) {
          p.guides.push(g._id);
          await p.save();
        }
      } else {
        p = new Panel({
          panelId: new mongoose.Types.ObjectId().toString(),
          name: panelName,
          guides: [g._id],
        });
        await p.save();
      }

      return p;
    };

    const p1 = await addGuideToPanel(panel1);
    const p2 = await addGuideToPanel(panel2);

    return res.status(200).json({
      message: "Guide successfully added to panels",
      panels: [p1, p2].filter(Boolean),
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Admin: Get team info
app.get("/admin_get_teaminfo", async (req, res) => {
  try {
    const guides = await guide.find({});
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

// Admin: Get professor data
app.get('/admin_get_profdata', async (req, res) => {
  try {
    const p = await profs.find();
    console.log(p);
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server running on http://localhost:${port}`));

// SLA Automation using node-cron
// const cron = require('node-cron');
// cron.schedule("*/30 * * * * *", async () => { // for testing, runs every 30 secs, we can change it acc to our use
//   console.log("⏰ Running automated SLA check...");
//   await checkSubmissions();
// });

// Export io for controllers
module.exports = { io };
