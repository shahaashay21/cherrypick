var logger = require('../utils/winston');
var mongoose = require('mongoose');

var os = require("os");
var hostname = os.hostname();

//Set up default mongoose connection
let mongoURI = "mongodb://mongo:27017/cherrypick";
if(hostname == "aashay"){
    mongoURI = "mongodb://localhost/cherrypick";
}
var mongoDB = mongoURI;

var options = {
    autoIndex: false, // Don't build indexes
    reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 10, // Maintain up to 10 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    useNewUrlParser: true
};

var db;

module.exports = {
    connect: async function(callback){
        try {
            await mongoose.connect(mongoDB, options);
            //Get the default connection
            db = mongoose.connection;
    
            //Bind connection to error event (to get notification of connection errors)
            db.on('error', console.error.bind(console, 'MongoDB connection error:'));
            return callback();
        } catch (err) {
            logger.error(`Failed to connect MongoDB: ${error}`);
            return callback(err);
        }
    },

    getConnection: function(){
        return db;
    }
}