const { model, Schema } = require('mongoose');

const UserSchema = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String },
  email: { type: String, required: true },
  password: { type: String, required: true },
  isMember: { type: Boolean, required: true },
});

UserSchema.virtual('username').get(function () {
  if (!this.lastName) return this.firstName;

  return `${this.firstName} ${this.lastName}`;
});

module.exports = model('User', UserSchema);
