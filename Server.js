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

const port = process.env.PORT || 3000;

connectDB()

app.use('/api/student',require('./Routes/studentRouter'))
app.use('/api/prof',require('./Routes/profRouter'))
app.use('/api/external',require('./Routes/externalRouter'))

app.get("/",(req,res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})