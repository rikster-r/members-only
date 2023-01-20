const { model, Schema } = require('mongoose');

const MessageSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
});

MessageSchema.virtual('date').get(function () {
  return this.timestamp.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: 'false',
  });
});

module.exports = model('Message', MessageSchema);
