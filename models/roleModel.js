const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const roleSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    active: {
        type: Boolean,
        default: true,
        select: true,
    },
});

const Role = mongoose.model("Role", roleSchema);
module.exports = Role;