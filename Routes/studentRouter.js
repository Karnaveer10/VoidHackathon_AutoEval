const express = require('express')
const userRouter = express.Router()
const auth = require('../middleware/auth');
const {loginUser,getInfo,getRegData,getRequestedData,getName,setIo} = require('../controllers/studentController')

userRouter.post('/login',loginUser)

userRouter.use(auth);

userRouter.get('/info',getInfo)
userRouter.post('/getName', getName)
userRouter.get('/RegData',getRegData)
userRouter.get('/reqData',getRequestedData)

module.exports = userRouter