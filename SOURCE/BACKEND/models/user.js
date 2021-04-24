const mongoose = require('mongoose');

const USER = module.exports = mongoose.model("User", mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    googleId: {
        type: String,
        required: true,
        unique: true
    }
}));

module.exports.getUsers = (callback, limit)=>{
    USER.find(callback).limit(limit);
};

module.exports.addUser = (name, googleId, callback)=>{
    USER.create({name, googleId}, callback);
};

module.exports.getUser = (googleId, callback)=>{
    USER.findOne({ googleId }, callback);
};

module.exports.deleteUser = (googleId, callback)=>{
    USER.deleteOne({ googleId }, callback);
};