const express = require('express');
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/login', authController.login);

router.get('/emails', authController.protect, userController.getAllEmails);

router.patch('/update', authController.protect, userController.updateUser);

router.post('/add-people', authController.protect, userController.addPeople);

module.exports = router;
