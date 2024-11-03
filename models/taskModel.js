const mongoose = require('mongoose');
const {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
} = require('date-fns');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'moderate', 'high'],
  },
  checkList: [
    {
      isDone: {
        type: Boolean,
        default: false,
      },
      checkListValue: {
        type: String,
        required: true,
      },
    },
  ],
  status: {
    type: String,
    required: true,
    enum: ['backlog', 'todo', 'inprogress', 'done'],
  },
  assignTo: {
    type: String,
  },
  dueDate: {
    type: Date,
  },
  user: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
});

// Static method to get status analytics
taskSchema.statics.getStatusAnalytics = async function (userId) {
  const statusCounts = await this.aggregate([
    {
      $match: { user: userId }, // Filter by userId
    },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const statusAnalytics = {
    backlog: 0,
    todo: 0,
    inProgress: 0,
    completed: 0,
  };

  statusCounts.forEach((status) => {
    switch (status._id) {
      case 'backlog':
        statusAnalytics.backlog = status.count;
        break;
      case 'todo':
        statusAnalytics.todo = status.count;
        break;
      case 'inprogress':
        statusAnalytics.inProgress = status.count;
        break;
      case 'done':
        statusAnalytics.completed = status.count;
        break;
      default:
        break;
    }
  });

  return statusAnalytics;
};

// Static method to get priority analytics
taskSchema.statics.getPriorityAnalytics = async function (userId) {
  const [priorityCounts, dueDateCount] = await Promise.all([
    this.aggregate([
      {
        $match: { user: userId }, // Filter by userId
      },
      {
        $group: {
          _id: '$priority',
          count: { $sum: 1 },
        },
      },
    ]),
    this.countDocuments({
      user: userId,
      dueDate: { $exists: true, $ne: null },
    }),
  ]);

  const priorityAnalytics = {
    low: 0,
    moderate: 0,
    high: 0,
    dueDate: dueDateCount,
  };

  priorityCounts.forEach((priority) => {
    switch (priority._id) {
      case 'low':
        priorityAnalytics.low = priority.count;
        break;
      case 'moderate':
        priorityAnalytics.moderate = priority.count;
        break;
      case 'high':
        priorityAnalytics.high = priority.count;
        break;
      default:
        break;
    }
  });

  return priorityAnalytics;
};

// Static method to get all analytics
taskSchema.statics.getAllAnalytics = async function (userId) {
  // Validate userId
  if (!userId) {
    throw new Error('userId is required for analytics');
  }

  // Convert userId to ObjectId if it's a string
  const userObjectId =
    typeof userId === 'string' ? mongoose.Types.ObjectId(userId) : userId;

  const [statusAnalytics, priorityAnalytics] = await Promise.all([
    this.getStatusAnalytics(userObjectId),
    this.getPriorityAnalytics(userObjectId),
  ]);

  return {
    status: statusAnalytics,
    priority: priorityAnalytics,
  };
};

taskSchema.statics.getFilteredTasks = async function ({
  filter,
  status,
  userId,
}) {
  const now = new Date();
  let startDate;
  let endDate;

  // Handling  time filter
  if (filter === 'today') {
    startDate = startOfDay(now);
    endDate = endOfDay(now);
  } else if (filter === 'this-week') {
    startDate = startOfWeek(now, { weekStartsOn: 1 }); // 1 represents Monday
    endDate = endOfWeek(now, { weekStartsOn: 1 });
  } else if (filter === 'this-month') {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
  }

  // Building the query object
  const query = {
    user: userId,
  };

  // Add date range to query if filter exists
  if (filter) {
    query.$or = [
      { dueDate: { $gte: startDate, $lte: endDate } }, // Tasks within the date range
      { dueDate: { $exists: false } }, // Tasks without a dueDate
    ];
  }

  // Add category filter if provided
  if (status) {
    query.status = status;
  }
  return this.find(query);
};

module.exports = mongoose.model('Task', taskSchema);
