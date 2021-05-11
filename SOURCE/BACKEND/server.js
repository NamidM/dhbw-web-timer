const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const https = require('https');
const querystring = require('querystring');
const cookieParser = require('cookie-parser')
const fs = require('fs');

/* Set environment parameters */
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
/* Include mongodb models */
const USER = require('./models/user');
const WEBACTIVITY = require('./models/webActivity');
const POST = require('./models/post');
mongoose.set('useNewUrlParser', true);
mongoose.set('useFindAndModify', false);
mongoose.set('useCreateIndex', true);
mongoose.set('useUnifiedTopology', true);

/* Origins */
server.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin);
  res.header('Access-Control-Allow-Headers', 'Origin, Accept, Content-Type, X-Requested-With');
  res.header('Content-Type', 'application/json');
  res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', true);
  next();
});
/* Start session */
server.use(session({
	secret: process.env.SESSION_SECRET,
	resave: true,
	saveUninitialized: true
}));
/* Set parsers */
server.use(bodyParser.json({ limit: '50mb', extended: true }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
server.use(bodyParser.json());
server.use(cookieParser());
/* Start mongo connection */
mongoose.connect(`mongodb://${process.env.DB_DOMAIN}:${process.env.DB_PORT}/${process.env.DB_TABLE}`);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

authUser = (req, res, next) => {
  /* Check if id_token invalid */
  try {
    let decodedIT = jwt.decode(req.cookies.id_token);
    let currentTime = new Date().getTime();
    /* If token can be decoded -> Check if valid */
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
    /* Send request to google servers with refresh token */
    if(req.cookies.refresh_token) {
      googleRequest({
        'grant_type': 'refresh_token',
        'client_id': process.env.CLIENT_ID,
        'client_secret': process.env.CLIENT_SECRET,
        'refresh_token': req.cookies.refresh_token
      }, (data)=>{
        if(data.error || !data.id_token) {
          /* Google request failed */
          res.clearCookie('refresh_token');
          res.clearCookie('id_token');
          res.send({message: "error", logout: true});
        } else {
          /* Set id_token cookie */
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
    } else {
      /* Unauthorized -> No refresh token given */
      res.clearCookie('refresh_token');
      res.clearCookie('id_token');
      res.send({message: "error", logout: true});
    }
  }
}
/* Endpoint to get all webActivities for a user in a timespan */
server.get("/webActivities", authUser, (req,res)=>{
  WEBACTIVITY.getWebActivitiesInTimespan(req.query.startTime, req.query.endTime, req.userID, (error, webActivities) => {
    if(error || !webActivities){
      res.send({message: "error"});
    } else {
      res.send(webActivities);
    }
  });
});
/* Endpoint to add a webActivity */
server.post("/webActivity", authUser, async (req,res)=>{
  WEBACTIVITY.addWebActivity(req.body.url, req.userID, req.body.faviconUrl, req.body.starttime, req.body.endtime, ()=>{
    res.send({message: "success"});
  });
});
/* Endpoint to get all posts */
server.get("/allPosts", authUser, async (req,res)=>{
  POST.getPosts((error, posts)=>{
    if(error || !posts) {
      res.send({message: "error"});
    } else {
      for(let i = 0; i<posts.length; i++) {
        /* If post ist posted by requested user -> set "self" to true */
        if(posts[i].users[0].googleId == req.userID) {
          posts[i].self = true;
        }
        /* Set username from looked up user */
        posts[i].username = posts[i].users[0].name;
        /* delete userID and looked up user -> not needed */
        posts[i].users = null;
        posts[i].userID = null; 
      }
      res.send({message: "success", posts });
    }
  });
});
/* Endpoint to add a post */
server.post("/post", authUser, async (req,res)=>{
  POST.addPost(req.body.title, req.body.content, req.userID, req.body.type, req.body.sites, new Date(), req.body.startTime, (error, post)=>{
    if(error || !post) {
      res.send({message: "error"});
    } else {
      res.send({message: "success"});
    }
  });
});
/* Endpoint to delete post */
server.delete("/post", authUser, (req, res) => {
  POST.deletePost(req.query._id, req.userID, (error, post)=>{
    if(error || !post) {
      res.send({message: "error"});
    } else {
      res.send({message: "success"});
    }
  });
})
/* Endpoint to update username */
server.put("/user", authUser, (req, res) => {
  USER.updateUser(req.userID, req.body.username, (error, user)=>{
    if(error || !user) {
      res.send({message: "error"});
    } else {
      res.send({message: "success", username: user.name});
    }
  });
})
/* Endpoint to delete user */
server.delete("/user", authUser, (req, res) => {
  USER.deleteUser(req.userID, (error, user)=>{
    if(error || !user) {
      res.send({message: "error"});
    } else {
      res.send({message: "success"});
      /* If user was successfully deleted, also delete posts from that user */
      WEBACTIVITY.deleteAllFromUser(req.userID, ()=>{});
    }
  });
})
/* Endpoint to get oAuthUrl -> sends oAuth url */
server.get("/getOAuthUrl", (req, res) => {
  /* Generate 2 random strings for a session key and a nonce for the url */
  let nonce = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  let state = encodeURIComponent(Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15));
  /* Set url parameters */
  const RESPONSE_TYPE = encodeURIComponent('id_token code');
  const SCOPE = encodeURIComponent('openid');
  const PROMPT = encodeURIComponent('consent');
  const CLIENT_ID = encodeURIComponent(process.env.CLIENT_ID);
  const REDIRECT_URI = req.query.redirect 
    ? encodeURIComponent(redirect_uri + req.query.redirect)
    : encodeURIComponent(process.env.REDIRECT_URI_EXTENSION);
  /* Create url */
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
/* Endpoint to check if user with ID is already registered */
server.get("/registerCheck", (req,res)=>{
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
    /* ID_token invalid */
    res.send({message: "error"});
  }
});
/* Endpoint to register user */
server.get("/register", (req,res)=>{
  if(req.query.authorization_code && req.query.id_token) {
    /* Send request to google servers with authorization code */
    googleRequest({
      'code': req.query.authorization_code,
      'grant_type': 'authorization_code',
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'redirect_uri': redirect_uri + "register"
    }, (data) => {
      if(data.error || !data.refresh_token || !data.id_token) {
        /* Google request failed */
        res.send({message: "error"});
      } else {
        try {
          let decoded = jwt.decode(req.query.id_token);
          USER.addUser(req.query.username, decoded.sub, (error, user)=>{
            if(error || !user) {
              /* User could not be added */
              res.send({message: "error"});
            } else {
              /* Set cookies for refresh_token and id_token */
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
          /* ID_token is invalid */
          res.send({message: "error"});
        } 
      }
    });
  } else {
    res.send({message: "error"});
  }
});
/* Endpoint for login request */
server.get("/login", (req,res)=>{
  let redirect = req.query.extension ? process.env.REDIRECT_URI_EXTENSION : redirect_uri + "login";
  if(req.query.authorization_code && req.query.id_token) {
    /* Send request to google servers with authorization code */
    googleRequest({
      'code': req.query.authorization_code,
      'grant_type': 'authorization_code',
      'client_id': process.env.CLIENT_ID,
      'client_secret': process.env.CLIENT_SECRET,
      'redirect_uri': redirect
    }, (data) => {
      if(data.error || !data.refresh_token || !data.id_token) {
        /* Google request failed */
        res.send({message: "error"});
      } else {
        try {
          let decodedIT = jwt.decode(req.query.id_token);
          getUserName(decodedIT.sub, (username)=>{
            if(username) {
              /* Set cookies for refresh_token and id_token */
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
              res.send({message: "success", username: username});
            } else {
              /* User not registered */
              res.send({message: "error"});
            }
          })
        } catch(e) {
          /* id_token invalid -> decode failed */
          res.send({message: "error"});
        } 
      }
    });
  } else {
    /* No authcode or id_token given */
    res.send({message: "error"});
  }
});
/* Enpoint for "silent login" -> Check if requested user is logged in */
server.get("/silentLogin", authUser, (req,res)=>{
  getUserName(req.userID, (username)=>{
    res.send({message: "success", username: username})
  });
});
/* Enpoint to logout user -> Clear cookies with auth tokens */
server.get("/logout", (req,res)=>{
  res.clearCookie('refresh_token');
  res.clearCookie('id_token');
  res.send({message: "success"});
});
/* Function to send a http request to google servers */
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
  /* Http Request */
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
    callback({message: "error"});
  });
  request.write(postData);
  request.end();
}
/* Function to get username by userID */
function getUserName(userID, callback) {
  USER.getUser(userID, (error, user)=>{
    if(error || !user) {
      callback(undefined);
    } else {
      callback(user.name);
    }
  })
}
/* Start server */
if(production) {
  https.createServer({
    key: fs.readFileSync(process.env.SSL_KEY, 'utf8'),
    cert: fs.readFileSync(process.env.SSL_CERT, 'utf8')
  }, server)
  .listen(port, hostname, function () {
    console.log(`Server running at https://${hostname}:${port}/`);
  })
} else {
  server.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
  });
}