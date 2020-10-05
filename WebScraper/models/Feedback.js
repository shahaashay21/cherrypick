var logger = require('../utils/winston');
var mongoose = require('mongoose');

let feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    feedback: String
},{
    collection: 'feedbacks',
    timestamps: true
});

let Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;