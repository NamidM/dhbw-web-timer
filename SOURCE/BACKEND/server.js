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
const fs = require('fs');
dotenv.config();
const production = process.env.PRODUCTION == "true";
let hostname = process.env.APP_HOSTNAME;
let redirect_uri = process.env.REDIRECT_URI;
if(production) {
  hostname = process.env.APP_HOSTNAME_PROD;
  redirect_uri = process.env.REDIRECT_URI_PROD;
}
const port = process.env.APP_PORT;
const server = express();
const USER = require('./models/user');
const WEBACTIVITY = require('./models/webActivity');
const POST = require('./models/post');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

/** Origins */
server.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, X-Requested-With');
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

server.use(session({
	secret: 'secret',
	resave: true,
	saveUninitialized: true
}));

server.use(bodyParser.json({ limit: '50mb', extended: true }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
server.use(bodyParser.json());
server.use(cookieParser());

if(production) {
    mongoose.connect(`mongodb://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}?authSource=admin`);
} else {
    mongoose.connect(`mongodb://${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}`);
}

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

authUser = (req, res, next) => {
  try {
    let decodedIT = jwt.decode(req.cookies.id_token);
    let currentTime = new Date().getTime();
    if(decodedIT.nonce == req.session.nonce ||
      decodedIT.iat*1000 < currentTime ||
      decodedIT.exp > currentTime ||
      decodedIT.aud == process.env.CLIENT_ID) {
      req.userID = decodedIT.sub;
      next();
    } else {
      throw "e";
    }
  } catch(e) {
    googleRequest({
      'grant_type': 'refresh_token',
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'refresh_token': req.cookies.refresh_token
    }, (data)=>{
      if(data.error || !data.id_token) {
        res.send({message: "error"});
      } else {
        let decodedIT = jwt.decode(data.id_token);
        res.cookie('id_token', data.id_token,  
        { maxAge: 60*60*1000,
          httpOnly: true,
          secure: production
        });
        req.userID = decodedIT.sub;
        next();
      }
    });
  }
}

server.get("/webActivities", authUser, (req,res)=>{
  let startTime = req.query.startTime;
  let endTime = req.query.endTime;
  WEBACTIVITY.getWebActivitiesInTimespan(startTime, endTime, req.userID, (error, webActivities) => {
    if(error){
      res.status(500).send("Backendfehler beim Laden von Web Activites");
    }else{
      res.status(200).json(webActivities);
    }
  });
});

server.post("/webActivity", authUser, async (req,res)=>{
  console.log("Received tracking call", req.body);
  WEBACTIVITY.addWebActivity(req.body.url, req.userID, req.body.faviconUrl, req.body.starttime, req.body.endtime, ()=>{
    res.send({message: "success"});
  });
});

server.post("/post", authUser, async (req,res)=>{
  console.log("Received post call", req.body);
  POST.addPost(req.body.title, req.body.content, req.userID, req.body.type, req.body.sites, new Date(), req.body.startTime, (error, post)=>{
    if(error || !post) {
      res.send({message: "error"});
    } else {
      res.send({message: "success"});
    }
  });
});

server.get("/allPosts", authUser, async (req,res)=>{
  console.log("Received allPosts call");
  POST.getPosts((error, posts)=>{
    if(error || !posts) {
      res.send({message: "error"});
    } else {
      for(let i = 0; i<posts.length; i++) {
        if(posts[i].users[0].googleId == req.userID) {
          posts[i].self = true;
        }
        posts[i].username = posts[i].users[0].name;
        posts[i].users = null;
        posts[i].userID = null; 
      }
      res.send({message: "success", posts });
    }
  });
});

server.get("/getOAuthUrl", (req, res) => {
  let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  let state = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  const CLIENT_ID = encodeURIComponent(process.env.CLIENT_ID);
  let REDIRECT_URI = encodeURIComponent(redirect_uri + req.query.redirect);
  if(!req.query.redirect) {
    REDIRECT_URI = encodeURIComponent(process.env.REDIRECT_URI_EXTENSION);
  }
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
  let redirect = req.query.extension ? process.env.REDIRECT_URI_EXTENSION : redirect_uri + "login";
  googleRequest({
    'code': req.query.authorization_code,
    'grant_type': 'authorization_code',
    'client_id': process.env.CLIENT_ID,
    'client_secret': process.env.CLIENT_SECRET,
    'redirect_uri': redirect
  }, (data) => {
    if(data.error) {
      res.send({message: "error"});
    } else {
      try {
        let decodedIT = jwt.decode(req.query.id_token);
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
        getUserName(decodedIT.sub, (username)=>{
          res.send({message: "success", username: username});
        })
      } catch(e) {
        res.send({message: "error"});
      } 
    }
  });
});

server.get("/silentLogin", authUser, (req,res)=>{
  console.log("silentLogin");
  getUserName(req.userID, (username)=>{
    res.send({message: "success", username: username})
  });
});

server.get("/logout", (req,res)=>{
  console.log("logout");
  res.clearCookie('refresh_token');
  res.clearCookie('id_token');
  res.send({message: "success"});
});

server.put("/user", authUser, (req, res) => {
  USER.updateUser(req.userID, req.body.username, (error, user)=>{
    if(error || !user) {
      res.send({message: "Username update failed"});
    } else {
      res.send({message: "Username changed successfully", username: user.name});
    }
  });
})

server.delete("/user", authUser, (req, res) => {
  console.log("delete user");
  USER.deleteUser(req.userID, (error, user)=>{
    if(error || !user) {
      res.send({message: "error"});
    } else {
      WEBACTIVITY.deleteAllFromUser(req.userID, (error, webActivities) => {
        if(error || !webActivities) {
          res.send({message: "error"});
        } else {
          res.send({message: "success"});
        }
      });
    }
  });
})

server.delete("/post", authUser, (req, res) => {
  console.log("delete user");
  POST.deletePost(req.query._id, req.userID, (error, post)=>{
    if(error || !post) {
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
    'redirect_uri': redirect_uri + "register"
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
            getUserName(decoded.sub, (username)=>{
              res.send({message: "success", username: username});
            })
          }
        });
      } catch(e) {
        res.send({message: "error"});
      } 
    }
  });
});

if(production) {
  https.createServer({
    key: fs.readFileSync('/etc/letsencrypt/live/gruppe10.testsites.info/privkey.pem', 'utf8'),
    cert: fs.readFileSync('/etc/letsencrypt/live/gruppe10.testsites.info/cert.pem', 'utf8')
  }, server)
  .listen(port, hostname, function () {
    console.log(`Server running at https://${hostname}:${port}/`);
  })
} else {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
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

function getUserName(userID, callback) {
  USER.getUser(userID, (error, user)=>{
    if(error || !user) {
      callback(undefined);
    } else {
      callback(user.name);
    }
  })
}