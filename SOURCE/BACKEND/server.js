const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require("body-parser");
const jwt = require('jsonwebtoken');
const https = require('https');
const querystring = require('querystring');
const cookieParser = require('cookie-parser')
dotenv.config();
const production = process.env.PRODUCTION == "true";
const hostname = process.env.APP_HOSTNAME;
const port = process.env.APP_PORT;
const server = express();
const USER = require('./models/user');
const WEBACTIVITY = require('./models/webActivity');
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
server.use(cookieParser());

if(production) {
    mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}?authSource=admin`);
} else {
    mongoose.connect(`mongodb://${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}`);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

server.get("/test", (req,res)=>{
  req.session.page_views = req.session.page_views ? req.session.page_views+=1 : 1;
  res.send("Page views: "+ req.session.page_views);
});

server.get("/webActivities", (req,res)=>{
  authUser(req, res, (userID)=> {
    let startTime = req.query.startTime;
    let endTime = req.query.endTime;
    WEBACTIVITY.getWebActivitiesInTimespan(startTime, endTime, userID, (error, webActivities) => {
      if(error){
        res.status(500).send("Backendfehler beim Laden von Web Activites");
      }else{
        res.status(200).json(webActivities);
      }
    });
  });
});

server.post("/tracking", async (req,res)=>{
  console.log("Received tracking call");
  for(i in req.body){
    let obj = req.body[i];
    WEBACTIVITY.addWebActivity(obj.url, obj.userID, obj.faviconUrl, obj.starttime, obj.endtime, ()=>{});
  }
});

server.get("/getOAuthUrl", (req, res) => {
  let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  let state = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const CLIENT_ID = encodeURIComponent(process.env.CLIENT_ID);
  const REDIRECT_URI = encodeURIComponent(process.env.REDIRECT_URI + req.query.redirect);
  console.log(REDIRECT_URI);
  const RESPONSE_TYPE = encodeURIComponent('id_token code');
  const SCOPE = encodeURIComponent('openid');
  const PROMPT = encodeURIComponent('consent');
  let url = `https://accounts.google.com/o/oauth2/v2/auth`
  + `?client_id=${CLIENT_ID}`
  + `&response_type=${RESPONSE_TYPE}`
  + `&redirect_uri=${REDIRECT_URI}`
  + `&state=${state}`
  + `&scope=${SCOPE}`
  + `&prompt=${PROMPT}`
  + `&access_type=offline`
  + `&nonce=${nonce}`;
  res.send({url: url});
});

server.get("/login", (req,res)=>{
  console.log("login")
  googleRequest({
    'code': req.query.authorization_code,
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': process.env.REDIRECT_URI + "login"
  }, (data) => {
    if(data.error) {
      res.send({message: "error"});
    } else {
      try {
        jwt.decode(req.query.id_token);
        res.cookie('refresh_token', data.refresh_token,  
          { maxAge: 7*24*60*60*1000,
            httpOnly: true,
            secure: production
          });
        res.cookie('id_token', data.id_token,  
          { maxAge: 60*60*1000,
            httpOnly: true,
            secure: production
          });
        res.send({message: "success"});
      } catch(e) {
        res.send({message: "error"});
      } 
    }
  });
});


server.get("/silentLogin", (req,res)=>{
  console.log("silentLogin");
  authUser(req, res, (userID)=> {
    res.send({message: "success"})
  });

});

server.get("/logout", (req,res)=>{
  console.log("logout");
  res.clearCookie('refresh_token');
  res.clearCookie('id_token');
  res.send({message: "success"});
});

server.delete("/user", (res, req) => {
  USER.deleteUser(req.query.userID, (error, user)=>{
    if(error || !user) {
      res.send({message: "error"});
    } else {
      res.send({message: "success"});
    }
  });
})

server.get("/registerCheck", (req,res)=>{
  console.log("registerCheck")
  try {
    let decoded = jwt.decode(req.query.id_token);
    USER.getUser(decoded.sub, (error, user)=>{
      if(error || user) {
        res.send({message: "error"});
      } else {
        res.send({message: "success"});
      }
    });
  } catch(e) {
    res.send({message: "error"});
  }
});

server.get("/register", (req,res)=>{
  console.log("register")
  googleRequest({
    'code': req.query.authorization_code,
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': process.env.REDIRECT_URI + "register"
  }, (data) => {
    if(data.error) {
      res.send({message: "error"});
    } else {
      try {
        let decoded = jwt.decode(req.query.id_token);
        USER.addUser(req.query.username, decoded.sub, (error, user)=>{
          if(error || !user) {
            res.send({message: "error"});
          } else {
            res.cookie('refresh_token', data.refresh_token,  
              { maxAge: 7*24*60*60*1000,
                httpOnly: true,
                secure: production
              });
            res.cookie('id_token', data.id_token,  
              { maxAge: 60*60*1000,
                httpOnly: true,
                secure: production
              });
            res.send({message: "success"});
          }
        });
      } catch(e) {
        res.send({message: "error"});
      } 
    }
  });
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
  WEBACTIVITY.getWebActivitiesInTimespan(0, 1617103561082,"0", (error, webActivities)=>{
  });
});

function authUser(req, res, callback) {
  try {
    let decodedIT = jwt.decode(req.cookies.id_token);
    let currentTime = new Date().getTime();
    if(decodedIT.nonce == req.session.nonce ||
      decodedIT.iat*1000 < currentTime ||
      decodedIT.exp > currentTime ||
      decodedIT.aud == process.env.CLIENT_ID) {
      callback(decodedIT.sub);
    } else {
      googleRequest({
        'grant_type': 'refresh_token',
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'refresh_token': req.cookies.refresh_token
      }, (data)=>{
        if(data.error || !data.id_token) {
          res.status(401);
        } else {
          res.cookie('id_token', data.id_token,  
          { maxAge: 60*60*1000,
            httpOnly: true,
            secure: production
          });
          callback(decodedIT.sub);
        }
      });
    }
  } catch(e) {
    res.status(401);
  }
}

function googleRequest(params, callback) {
  const postData = querystring.stringify(params);
  const options = {
    hostname: 'oauth2.googleapis.com',
    path: '/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }

  const request = https.request(options, response => {
    let resData = [];
    response.on('data', d => {
      resData.push(d);
    });
    response.on('end', ()=> {
      resData = Buffer.concat(resData).toString().replace(/\n/g, "");
      resData = JSON.parse(resData);
      callback(resData);
    })
  }).on('error', error => {
    callback({message: "error", error: error});
  });
  request.write(postData);
  request.end();
}