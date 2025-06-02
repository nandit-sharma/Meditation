const mongoose = require('mongoose');

const meditationDataSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    enum: ['Nandit', 'Daksh', 'Harish', 'Samar']
  },
  date: {
    type: String,
    required: true
  },
  completed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

meditationDataSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('MeditationData', meditationDataSchema); 