const express = require('express')
const userRouter = express.Router()
const {loginUser} = require('../controllers/registerController')

userRouter.post('/register',registerUser)

module.exports = userRouter