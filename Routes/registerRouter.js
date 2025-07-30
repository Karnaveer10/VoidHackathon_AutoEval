const express = require('express')
const userRouter = express.Router()
const {individual,team} = require('../controllers/registerController')

userRouter.post('/individual',individual)
userRouter.post('/team',team)

module.exports = userRouter