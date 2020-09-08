var logger = require('../utils/winston');
let User = require('../models/User');

const getUid = async function(req, res, next){
    let errorMessage = "";
    let error = 1;
    let data = {};

    try{
        let userObj = new User();
        userObj.fname("testing");
        data = await userObj.save();
        error = 0;
        response.data = data;
    } catch (e){
        logger.error(e);
        errorMessage = e;
        error = 1;
    }
    let response = { error: error };
    if(error){
        response.message = errorMessage.toString();
    }
    res.json(response);
};

exports.getUid = getUid;