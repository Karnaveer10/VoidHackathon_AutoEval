const express = require('express')
const userRouter = express.Router()
const {register} = require('../controllers/registerController')

userRouter.put('/request',register);

module.exports = userRouter