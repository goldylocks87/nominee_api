const mongoose = require('mongoose');
const validator = require('validator');

var Nominee = mongoose.model('Nominee', {

    _creator: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },

    name: {
        type: String,
        required: true,
    },

    email: {
        type: String,
        required: true,
        trim: true,
        minlength: 1,
        unique: true,
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email'
        }
    },

    votes: {
        type: Number,
        required: false
    }
});

module.exports = { Nominee };