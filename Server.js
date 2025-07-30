const express =  require('express');
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

connectDB()

app.use('/api/student',require('./Routes/studentRouter'))
app.use('/api/prof',require('./Routes/profRouter'))
app.use('/api/external',require('./Routes/externalRouter'))
app.use('/api/register',require('./Routes/registerRouter'))

app.get("/", (req, res) => {
  res.send("API Working")
})
app.post('/teamregistration', async (req, res) => {
  try {
    const { pid, members } = req.body;

    console.log("Creating new master document with:", req.body);

    const newMaster = new Master({
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




app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`)
})
