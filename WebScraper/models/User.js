var logger = require('../utils/winston');
var mongoose = require('mongoose');


var userSchema = new mongoose.Schema({
	fname: {type: String},
	lname: {type: String},
	email: {type: String}
},
{
	collection: 'userss',
    timestamps: true,
    versionKey: false
});


var User = mongoose.model('User', userSchema);

module.exports = User;
