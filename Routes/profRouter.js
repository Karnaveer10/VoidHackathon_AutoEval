const express = require('express')
const auth = require('../middleware/auth')
const userRouter = express.Router()
const {loginUser,getinfo,getprof,acceptReq,removeReq} = require('../controllers/profController')

userRouter.post('/login',loginUser)
userRouter.get('/allprof',getinfo)

userRouter.use(auth);

userRouter.get('/findprof',getprof)
userRouter.put('/acceptRequest',acceptReq)
userRouter.put('/removeRequest',removeReq)

module.exports = userRouter