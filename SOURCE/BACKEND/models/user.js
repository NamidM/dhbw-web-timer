const mongoose = require('mongoose');

const USER = module.exports = mongoose.model("User", mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    }
}));

module.exports.getUsers = (callback, limit)=>{
    USER.find(callback).limit(limit);
};

module.exports.addUser = (name, email, callback)=>{
    USER.create({name, email}, callback);
};

module.exports.getUser = (name, password, callback)=>{
    USER.findOne(callback);
};