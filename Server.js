const express =  require('express');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose')
const connectDB = require('./config/dbConn')

const port = process.env.PORT || 3000;

//middlewares
app.use(express.json())
const cors = require('cors')
app.use(cors())
require('dotenv').config()

connectDB()

app.use('/api/student',require('./routes/studentloginRouter'))

app.get("/",(req,res)=>{
    res.send("API Working")
})

app.listen(port,()=>{
    console.log(`Server started on http://localhost:${port}`)
})