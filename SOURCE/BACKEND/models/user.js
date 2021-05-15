const mongoose = require('mongoose');

const USER = module.exports = mongoose.model("User", mongoose.Schema({
    /* Username -> Can be changed */
    name: {
        type: String,
        required: true,
        unique: true
    },
    /* googleId -> locked to google Account */
    googleId: {
        type: String,
        required: true,
        unique: true
    }
}));
/* Function to get all users */
module.exports.getUsers = (callback, limit)=>{
    USER.find(callback).limit(limit);
};
/* Function to add user */
module.exports.addUser = (name, googleId, callback)=>{
    USER.create({name, googleId}, callback);
};
/* Function to get user by id */
module.exports.getUser = (googleId, callback)=>{
    USER.findOne({ googleId: googleId }, callback);
};
/* Function to delete user */
module.exports.deleteUser = (googleId, callback)=>{
    USER.deleteOne({ googleId }, callback);
};
/* Function to update username */
module.exports.updateUser = (googleId, name, callback)=>{
    USER.findOneAndUpdate({ googleId }, { name }, {new: true} , callback);
};
/* Function to find a username to check if the name exists */
module.exports.findUsername = (name, callback)=>{
    USER.findOne({ name }, {}, {}, callback);
};