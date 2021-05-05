const mongoose = require('mongoose');
const POST = module.exports = mongoose.model("Post", mongoose.Schema({
    /* Title of the post */
    title: {
        type: String,
        required: true
    },
    /* Content of the post */
    content: {
        type: String,
        required: true
    },
    /* userID of the user that posted */
    userID: {
        type: String,
        required: true
    },
    /* Data for bar and line charts */
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
    /* Data for donut charts */
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
                required: false
            },
            visits: {
                type: Number,
                required: true
            }
        }],
        required: false
    },
    /* Time that the post was posted */
    postTime: {
        type: Date,
        required: true
    },
    /* Type of the chart */
    type: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'total'],
        required: true
    },
    /* For donut charts -> The day of the chart */
    time: {
        type: Date,
        required: false
    }
}));
/* Function to get all posts */
module.exports.getPosts = (callback, limit)=>{
    /* Join post on user.googleID = post.userID and sort by date */
    POST.aggregate([
        { $sort: {"postTime": -1} },
        { $lookup: { from: "users", localField: 'googleId', foreignField: 'userID', as: "users"} }
    ], callback);
};
/* Function to delete post by _id */
module.exports.deletePost = (_id, userID, callback)=>{
    POST.deleteOne({ _id, userID }, callback);
};
/* Function to add post */
module.exports.addPost = (title, content, userID, type, sites, postTime, time, callback)=>{
    if(type == 'daily' || type == 'total') {
        /* If chart is donut -> post sites */
        POST.create({title, content, userID, sites, postTime, type, time}, callback);
    } else {
        /* If chart is bar or line -> post timeData */
        POST.create({title, content, userID, timeData: sites, postTime, type, time}, callback);
    }
};