const express = require('express')
const auth = require('../middleware/auth')
const userRouter = express.Router()
const {loginUser,getinfo,getprof,acceptReq,removeReq,acceptedTeams,acceptSubmission,reSubmit} = require('../controllers/profController')

userRouter.post('/login',loginUser)
userRouter.get('/allprof',getinfo)

userRouter.use(auth);

userRouter.get('/findprof',getprof)
userRouter.put('/acceptRequest',acceptReq)
userRouter.put('/removeRequest',removeReq)
userRouter.get('/getAteams',acceptedTeams)
userRouter.post("/acceptSubmission", acceptSubmission);
userRouter.post("/reSubmit", reSubmit);

module.exports = userRouter