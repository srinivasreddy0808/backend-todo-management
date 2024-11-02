const User = require('../models/userModel');
const Task = require('../models/taskModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.getAllEmails = catchAsync(async (req, res) => {
  const users = await User.find({}, 'email');
  res.status(200).json({
    status: 'success',
    data: {
      users,
    },
  });
});

exports.updateUser = catchAsync(async (req, res, next) => {
  if ('name' in req.body) {
    req.body.userName = req.body.name;
    delete req.body.name;
  }
  const user = await User.updateUserData(req.user._id, req.body);
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });
});

exports.addPeople = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return next(new AppError('Please provide an email', 400));
  }
  const userToAdd = await User.findOne({ email });
  if (!userToAdd) {
    return next(new AppError('No user found with that email', 404));
  }
  const currentUserId = req.user._id;

  const tasks = await Task.find({
    user: currentUserId,
  });

  if (tasks.length === 0) {
    return next(new AppError('No tasks found for the current user', 404));
  }

  // Using Promise.all for parallel execution
  await Promise.all(
    tasks.map(async (task) => {
      // Check if user is already in the task
      if (!task.user.includes(userToAdd._id)) {
        task.user.push(userToAdd._id);
        await task.save();
      }
    }),
  );

  res.status(200).json({
    status: 'success',
    message: `User ${userToAdd.userName} has been added to ${tasks.length} tasks`,
    data: {
      addedToTasks: tasks.length,
      addedUser: {
        id: userToAdd._id,
        email: userToAdd.email,
        userName: userToAdd.userName,
      },
    },
  });
});
