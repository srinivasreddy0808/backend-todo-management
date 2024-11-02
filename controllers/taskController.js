const mongoose = require('mongoose');
const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');

exports.getAllTasks = catchAsync(async (req, res) => {
  const { filter, status } = req.query;
  const userId = req.user._id;

  const tasks = await Task.getFilteredTasks({ filter, status, userId });

  res.status(200).json({
    status: 'success',
    data: {
      tasks,
    },
  });
});

exports.createTask = catchAsync(async (req, res) => {
  const { user = [], assignTo } = req.body;
  user.push(req.user._id);
  console.log(req.body, user, assignTo);
  if (assignTo && mongoose.Types.ObjectId.isValid(assignTo)) {
    console.log(assignTo, 'assign to is exectued');
    user.push(assignTo);
  }
  req.body.user = user;

  const task = await Task.create(req.body);
  res.status(201).json({
    status: 'success',
    data: {
      task,
    },
  });
});

// this on we used for status changing
exports.updateTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findByIdAndUpdate(taskId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

exports.replaceTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;
  const { user = [], assignTo } = req.body;
  user.push(req.user._id);

  // Only add assignTo if it exists and is a valid ObjectId
  if (assignTo && mongoose.Types.ObjectId.isValid(assignTo)) {
    user.push(mongoose.Types.ObjectId(assignTo));
  }
  req.body.user = user;

  const task = await Task.findByIdAndUpdate(taskId, req.body, {
    new: true,
    runValidators: true,
  });
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

exports.getAnalytics = catchAsync(async (req, res) => {
  const analytics = await Task.getAllAnalytics();

  return res.status(200).json({
    success: true,
    data: analytics,
  });
});

exports.getTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findById(taskId);
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});

exports.deleteTask = catchAsync(async (req, res) => {
  const { taskId } = req.params;

  const task = await Task.findByIdAndDelete(taskId);
  res.status(200).json({
    status: 'success',
    data: {
      task,
    },
  });
});
