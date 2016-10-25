var express = require('express');
// load the mysql library
var mysql = require('mysql');
var bodyParser = require('body-parser');
var myWebServer = express();
myWebServer.use(bodyParser.urlencoded({
    extended: false
}));
myWebServer.set('view engine', 'pug');


// create a connection to our Cloud9 server
var connection = mysql.createConnection({
    host: 'localhost',
    user: 'yaroncnk', // CHANGE THIS :)
    password: '',
    database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);



// This function will be called once for every request
// Because it doesn't want to send a response, it calls next()
// This is called a **middleware** we will talk about it in class
myWebServer.use(function(request, response, next) {
    console.log(request.method + ' ' + request.url);

    next();
});

function todayDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1; //January is 0!
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd
    }

    if (mm < 10) {
        mm = '0' + mm
    }

    today = mm + '/' + dd + '/' + yyyy;
    return today;
}

// This function will only be called if the request method is GET and the url path is /hello
// myWebServer.get('/hello', function(request, response) {
//     console.log(request.query);
//     response.send('<h1>Hello World!</h1>');
// });

// This function will only be called if the request method is GET and the url path is /hello?name=firstName with a firstName
// myWebServer.get('/hello', function(request, response) {
//     console.log(request.query);
//     response.send('<h1>Hello' + request.query.name + '!</h1>');
// });

// This function will only be called with a url 
myWebServer.get('/hello/:any_key_name', function(request, response) {
    if (request.params.any_key_name) {
        response.send('<h1>Hello ' + request.params.any_key_name + '!</h1>');
    }
    else {
        console.log('no go');
    }
});

//ex. 3 - this function performs numerical operations on two numbers
myWebServer.get('/calculator/:operation', function(request, response) {
    var calculationProcess = {
        operator: request.params.operation,
        firstOperand: request.query.num1,
        secondOperand: request.query.num2,

    };
    if (request.params.operation === 'add') {


        calculationProcess.solution = parseInt(request.query.num1) + parseInt(request.query.num2);

    }
    else if (request.params.operation === 'sub') {
        calculationProcess.solution = parseInt(request.query.num1) - parseInt(request.query.num2);
    }
    else if (request.params.operation === 'div') {
        calculationProcess.solution = parseInt(request.query.num1) / parseInt(request.query.num2);

    }
    else if (request.params.operation === 'mult') {
        calculationProcess.solution = parseInt(request.query.num1) * parseInt(request.query.num2);
    }
    else {
        response.status(400).send(' Not found');

    }


    response.send(calculationProcess);

});

// ex. 4 - getAllPosts
myWebServer.get('/posts', function(request, response) {

    redditAPI.getAllPosts(5, function(err, content) {
        if (err) {
            return err;
        }
        else {
            response.render('post-list', {content: content});

        }
    })
});

//ex. 5 + 6 - creating a form 

myWebServer.get('/createContent', function(req, res) {
    res.render('create-content');


});

//ex. 6 - posting information from the post

myWebServer.post('/createContent', function(req, res, next) {

            var title = req.body.title ;
            var url = req.body.url ;
            var newPost = {userId:1, title: title, url: url, createdAt: todayDate()};
            redditAPI.createPost( newPost, 4, function(err, object){
                if (err) {
                    console.log(err);
                }
                else {
                console.log(object);
                }
            });
            next();
                },
                function(req, res, next) {
                    res.redirect('/posts');
                });

        // This function will make the server listen 24/7 for incoming requests. Web servers never sleep!
        myWebServer.listen(process.env.PORT);