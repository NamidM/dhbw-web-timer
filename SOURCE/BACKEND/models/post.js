const mongoose = require('mongoose');
const POST = module.exports = mongoose.model("Post", mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    content: {
        type: String,
        required: true
    },
    userID: {
        type: String,
        required: true
    },
    timeData: {
        type: [{
            stack: {
                type: String,
                required: true
            },
            data: {
                type: [Number],
                required: true
            },
            label: {
                type: String,
                required: false
            }
        }],
        required: false
    },
    sites: { 
        type: [{
            favicon: {
                type: String,
                required: true
            },
            percentage: {
                type: Number,
                required: true
            },
            prettyTime: {
                type: String,
                required: true
            },
            time: {
                type: Number,
                required: true
            },
            url: {
                type: String,
                required: true
            },
            visits: {
                type: Number,
                required: true
            }
        }],
        required: false
    },
    postTime: {
        type: Date,
        required: true
    },
    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'total'],
        required: true
    },
    time: {
        type: Date,
        required: false
    }
}));

module.exports.getPosts = (callback, limit)=>{
    POST.aggregate([
        { $sort: {"postTime": -1} },
        { $lookup: { from: "users", localField: 'googleId', foreignField: 'userID', as: "users"} }
    ], callback);
};

module.exports.deletePost = (_id, userID, callback)=>{
    POST.deleteOne({ _id, userID }, callback);
};

module.exports.addPost = (title, content, userID, type, sites, postTime, time, callback)=>{
    if(type == 'daily' || type == 'total') {
        POST.create({title, content, userID, sites, postTime, type, time}, callback);
    } else {
        POST.create({title, content, userID, timeData: sites, postTime, type, time}, callback);
    }
};