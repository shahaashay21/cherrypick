var logger = require('../utils/winston');
let Feedback = require('../models/Feedback');

const getFeedback = async function(req, res, next){
    let errorMessage = "";
    let error = 1;
    let data = {};

    try{
        let email = req.params.email;
        data = await Feedback.find({ email: email }, 'name email feedback');
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

const setFeedback = async function(req, res, next){
    let errorMessage = "";
    let error = 1;
    try{
        let name = req.body.name;
        let email = req.body.email;
        let feedback = req.body.feedback;
        if(name && email && feedback){
            let feedbackObj = new Feedback();
            feedbackObj.name = name;
            feedbackObj.email = email;
            feedbackObj.feedback = feedback;
            await feedbackObj.save();
            error = 0;
        } else {
            errorMessage = "One of the field is empty";
            error = 1;
        }
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

// Just an API for testing purpose
const updateTest = async function(req, res, next){
    try{
        let ans = await Feedback.updateOne({name: "aashay shaha"}, {name: "aashay shah"});
        res.json({error: 0, message: ans});
    } catch (error){
        res.json({error: 1, message: error});
    }
}
exports.updateTest = updateTest;

exports.getFeedback = getFeedback;
exports.setFeedback = setFeedback;