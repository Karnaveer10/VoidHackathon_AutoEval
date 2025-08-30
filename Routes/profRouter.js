const express = require('express')
const userRouter = express.Router()
const {loginUser,getinfo,getprof} = require('../controllers/profController')

userRouter.post('/login',loginUser)
userRouter.get('/allprof',getinfo)
userRouter.get('/findprof',getprof)

module.exports = userRouter