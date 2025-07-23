const express = require('express')
const userRouter = express.Router()
const {loginUser} = require('../controllers/externalController')

userRouter.post('/login',loginUser)

module.exports = userRouter