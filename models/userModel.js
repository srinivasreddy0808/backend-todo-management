const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/appError');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: [true, 'Please provide user name'],
  },
  email: {
    type: String,
    required: [true, 'Please provide email'],
    unique: true,
  },
  password: {
    type: String,
    required: [true, 'Please provide password'],
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // Only run this function if password was actually modified
  if (!this.isModified('password')) return next();

  // Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};
// Method to update user with password check
userSchema.statics.updateUserData = async function (userId, updateData) {
  const { oldPassword, newPassword, ...otherUpdates } = updateData;

  // If password update is requested
  if (oldPassword && newPassword) {
    // Get user with password
    const user = await this.findById(userId).select('+password');

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Verify old password
    const isPasswordCorrect = await user.correctPassword(
      oldPassword,
      user.password,
    );

    if (!isPasswordCorrect) {
      throw new AppError('Current password is incorrect', 400);
    }

    // Update password and other fields
    user.password = newPassword;
    Object.assign(user, otherUpdates);

    await user.save();

    // Remove password from output
    user.password = undefined;
    return user;
  }

  // If no password update, just update other fields
  const user = await this.findByIdAndUpdate(userId, otherUpdates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  return user;
};

module.exports = mongoose.model('User', userSchema);
