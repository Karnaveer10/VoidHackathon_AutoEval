const express = require('express');
const userRouter = express.Router();
const { logoutController } = require('../controllers/logoutController');

userRouter.post('/', logoutController);

module.exports = userRouter;
