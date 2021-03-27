const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require("body-parser");
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
server.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));
server.use(bodyParser.urlencoded({ extended: false }));
server.use(bodyParser.json());

if(production) {
    mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}?authSource=admin`);
} else {
    mongoose.connect(`mongodb://${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}`);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

server.get("/test", (req,res)=>{
  USER.getUsers((error, users)=>{
    if(error) {
      res.status(500).send("Fehler!");
    } else {
      res.status(200).json(users);
    }
  });
});

server.post("/test2", (req,res)=>{
  res.send({"data": req.body});
  console.log({"data": req.body})
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});

server.post("/login", (req,res)=>{
  res.send({token: "1234567"});
  console.log({"data": req.body})
});