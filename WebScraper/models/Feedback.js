var logger = require('../utils/winston');
var mongoose = require('mongoose');
mongoose.connect("mongodb://localhost/cherrypick", {useNewUrlParser: true});
var connection = mongoose.connection;
connection.on('error', (error) => logger.error(`Mongodb connection error: ${error}`));

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