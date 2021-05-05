const mongoose = require('mongoose');

const WEBACTIVITY = module.exports = mongoose.model("WebActivity", mongoose.Schema({
    /* Url from the website */
    url: {
        type: String,
        required: true
    },
    /* UserID from user */
    userID: {
        type: String,
        required: true
    },
    /* Url to favicon from page */
    faviconUrl: {
        type: String,
        required: true
    },
    /* Time in milliseconds when the site was opened */
    starttime: {
        type: Number,
        required: true
    },
    /* Time in milliseconds when the site was closed */
    endtime: {
        type: Number,
        required: true
    }
}));
/* Function to add webactivity */
module.exports.addWebActivity = (url, userID, faviconUrl, starttime, endtime, callback)=>{
    WEBACTIVITY.create({url, userID, faviconUrl, starttime, endtime }, callback);
};
/* Function to get all webactivities in timespan */
module.exports.getWebActivitiesInTimespan = (startTime, endTime, userId, callback)=>{
    WEBACTIVITY.find({starttime: {$gte: startTime}, endtime: {$lte: endTime}, userID: userId}, callback);
};
/* Function to delete all webactivities from user */
module.exports.deleteAllFromUser = (userId, callback)=>{
    WEBACTIVITY.deleteMany({userID: userId}, callback);
};