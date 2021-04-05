const mongoose = require('mongoose');

const WEBACTIVITY = module.exports = mongoose.model("WebActivity", mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    starttime: {
        type: Number,
        required: true
    },
    endtime: {
        type: Number,
        required: true
    },
    userID: {
        type: String,
        required: true
    }
}));

module.exports.getWebActivities = (callback, limit)=>{
    WEBACTIVITY.find(callback).limit(limit);
};

module.exports.addWebActivity = (url, starttime, endtime, userID, callback)=>{
    WEBACTIVITY.create({url, starttime, endtime, userID}, callback);
};

module.exports.getWebActivity = (_id, callback)=>{
    WEBACTIVITY.findOne(callback);
};

module.exports.getWebActivityByUser = (userId, callback)=>{
    WEBACTIVITY.find({userID: userId}, callback);
};

module.exports.getWebActivitiesInTimespan = (startTime, endTime, userId, callback)=>{
    WEBACTIVITY.find({starttime: {$gte: startTime}, endtime: {$lte: endTime}, userID: userId}, callback);
};