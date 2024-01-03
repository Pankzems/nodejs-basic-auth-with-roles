const Role = require('../models/roleModel');
const base = require('./baseController');
const AppError = require("../utils/appError");

exports.getAllRoles = base.getAll(Role);