//loading libraries - express, mysql, body-parser, and express.js

var express = require('express');
var moment = require('moment');
var mysql = require('mysql');
var bodyParser = require('body-parser');
var myApp = express();
var cookieParser = require('cookie-parser');
myApp.use(bodyParser.urlencoded({
    extended: false
}));
myApp.set('view engine', 'pug');
myApp.use(express.static('files'));
myApp.use(cookieParser());
myApp.use(checkLoginToken);


// create a connection to our Cloud9 server
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'yaroncnk',
    password: '',
    database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);



// Middleware
myApp.use(function(request, response, next) {
    console.log(request.method + ' ' + request.url);

    next();
});


// This is the homepage that will use the function getAllPosts() to show 25 posts for anyone 
// who is either logged in or not

myApp.get('/', function(request, response) {

    redditAPI.getAllPosts(25, function(err, content) {
        if (err) {
            return err;
        }
        else {
            response.render('layout', {
                content: content
            });

        }
    });
});

// This is a function that shows the five latest posts for anyone 
// who is either logged in or not

myApp.get('/new', function(request, response) {

    redditAPI.getNewPosts(5, function(err, content) {
        if (err) {
            return err;
        }
        else {
            response.render('layout', {
                content: content
            });

        }
    });
});


//moving to the form page to create posts
myApp.get('/createContent', function(req, res) {
    res.render('create-content');


});
//Posting information from the post

// myApp.post('/createContent', function(req, res, next) {

//         var title = req.body.title;
//         var url = req.body.url;
//         var newPost = {
//             userId: 1,
//             title: title,
//             url: url,
//             createdAt: todayDate()
//         };
//         redditAPI.createPost(newPost, 4, function(err, object) {
//             if (err) {
//                 console.log(err);
//             }
//             else {
//                 console.log(object);
//             }
//         });
//         next();
//     },
//     function(req, res, next) {
//         res.redirect('/');
//     });

//this function loads the sign-up form
myApp.get('/sign-up', function(req, res) {
    res.render('sign-up');
});

//This is a sign-up function
myApp.post('/sign-up', function(req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var identity = {
        username: username,
        password: password,
        createdAt: moment().format()
    };
    redditAPI.createUser(identity, function(err, object) {
        if (err) {
            res.status(400).send('Something went wrong:' + err.stack);
        }
        else {
            res.redirect('/login');
        }
    });

});

//this function loads the log-in form
myApp.get('/login', function(req, res) {
    res.render('login');
});

//this function loads the signed-in page
myApp.get('/signed-in-user', function(request, response) {

    redditAPI.getAllPosts(25, function(err, content) {
        if (err) {
            return err;
        }
        else {
            response.render('signed-in-user', {
                content: content
            });

        }
    });
});


//this function creates the actual session and the token
myApp.post('/login', function(request, response) {
    redditAPI.checkLogin(request.body.username, request.body.password, function(err, user) {
        if (err) {
            response.status(401).send(err.message);
        }
        else {
            redditAPI.createSession(user.id, function(err, token) {
                if (err) {
                    response.status(500).send('an error occurred. please try again later!');
                }
                else {
                    response.cookie('SESSION', token); // the secret token is now in the user's cookies!
                    response.redirect('/signed-in-user');
                }
            });
        }
    });
});

//this is the middleware for the cookie
function checkLoginToken(request, response, next) {
    // check if there's a SESSION cookie...
    if (request.cookies.SESSION) {
        redditAPI.getUserFromSession(request.cookies.SESSION, function(err, user) {
            // if we get back a user object, set it on the request. From now on, this request looks like it was made by this user as far as the rest of the code is concerned
            if (err) {
                response.status(501).send(err.message);
            }
            else if (user) {
                request.loggedInUser = user;
            }
            next();
        });
    }
    else {
        // if no SESSION cookie, move forward
        next();
    }
}

myApp.post('/signed-in-user', function(request, response) {
    // before creating content, check if the user is logged in
    if (!request.loggedInUser) {
        // HTTP status code 401 means Unauthorized
        response.status(401).send('You must be logged in to create content!');
    }
    else {
        // here we have a logged in user, let's create the post with the user!
        console.log('I am here', request.loggedInUser);
        redditAPI.createPost({
            title: request.body.title,
            url: request.body.url,
            userId: request.loggedInUser.id,
            createdAt: moment().startOf('hour').fromNow()
        }, request.body.subreddit ,  function(err, post) {
            if (err) {
                response.status(501).send('There was a problem posting our content!');
            }
            else {
                response.redirect('/');  
            }
        });
    }
});




// This function will make the server listen 24/7 for incoming requests. Web servers never sleep!
myApp.listen(process.env.PORT);