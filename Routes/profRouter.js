const express = require('express')
const auth = require('../middleware/auth')
const userRouter = express.Router()
const {loginUser,getinfo,getprof,acceptReq,rejectReq} = require('../controllers/profController')

userRouter.post('/login',loginUser)
userRouter.get('/allprof',getinfo)

userRouter.use(auth);

userRouter.get('/findprof',getprof)
userRouter.get('/acceptRequest',acceptReq)
userRouter.put('/rejectRequest',rejectReq)

module.exports = userRouter