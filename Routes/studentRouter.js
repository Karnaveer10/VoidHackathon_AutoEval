const express = require('express')
const userRouter = express.Router()
const {loginUser,getInfo} = require('../controllers/studentController')

userRouter.post('/login',loginUser)
userRouter.post('/info',getInfo)

module.exports = userRouter