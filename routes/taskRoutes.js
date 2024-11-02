const express = require('express');
const authController = require('../controllers/authController');
const taskController = require('../controllers/taskController');

const router = express.Router();

router
  .route('/')
  .get(authController.protect, taskController.getAllTasks)
  .post(authController.protect, taskController.createTask);

router
  .route('/:taskId')
  .patch(authController.protect, taskController.updateTask)
  .put(authController.protect, taskController.replaceTask)
  .delete(authController.protect, taskController.deleteTask);

router
  .route('/analytics')
  .get(authController.protect, taskController.getAnalytics);

router.route('/public/:taskId').get(taskController.getTask);

module.exports = router;
