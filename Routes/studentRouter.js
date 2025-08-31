const express = require('express')
const userRouter = express.Router()
const auth = require('../middleware/auth');
const {loginUser,getInfo} = require('../controllers/studentController')

userRouter.post('/login',loginUser)

userRouter.use(auth);

userRouter.get('/info',getInfo)

module.exports = userRouter