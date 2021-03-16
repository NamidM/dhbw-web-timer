const mongoose = require('mongoose');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
dotenv.config();
const production = process.env.PRODUCTION == "true";
const hostname = process.env.APP_HOSTNAME;
const port = process.env.APP_PORT;
const server = express();
const USER = require('./models/user');
server.use(cors());
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

/** Origins */
server.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

if(production) {
    mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}?authSource=admin`);
} else {
    mongoose.connect(`mongodb://${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}`);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
  console.log("db connection succesful")
});

server.get("/test", (req,res)=>{
  USER.getUsers((error, users)=>{
    if(error) {
      res.status(500).send("Fehler!");
    } else {
      res.status(200).json(users);
    }
  });
  USER.addUser("Nils", "google.de", (error, user)=>{
    if(error) {
      console.log("Fehler:", error.message);
    } else {
      console.log(users);
    }
  });
});

server.get("/elian", (req,res)=>{
  res.status(200).json({"data": "test"});
});


server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});