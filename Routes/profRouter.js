const express = require('express')
const userRouter = express.Router()
const {loginUser,getinfo} = require('../controllers/profController')

userRouter.post('/login',loginUser)
userRouter.get('/allprof',getinfo)

module.exports = userRouter