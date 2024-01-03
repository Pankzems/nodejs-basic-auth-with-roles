const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: [validator.isEmail],
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  address: {
    type: String,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: true,
    validate: {
      validator: function(el) {
        // "this" works only on create and save
        return el === this.password;
      },
      message: "Your password and confirmation password are not the same",
    },
  },
  roles: {
    type: Array,
    required: true
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

// encrypt the password using 'bcryptjs'
// Mongoose -> Document Middleware
userSchema.pre("save", async function(next) {
  // check the password if it is modified
  if (!this.isModified("password")) {
    return next();
  }

  // Hashing the password
  this.password = await bcrypt.hash(this.password, 12);

  // Delete passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

// This is Instance Method that is gonna be available on all documents in a certain collection
userSchema.methods.correctPassword = async function(
  typedPassword,
  originalPassword,
) {
  return await bcrypt.compare(typedPassword, originalPassword);
};

const User = mongoose.model("User", userSchema);
module.exports = User;
