var express = require('express');

var myWebServer = express();

// This function will be called once for every request
// Because it doesn't want to send a response, it calls next()
// This is called a **middleware** we will talk about it in class
myWebServer.use(function(request, response, next) {
    console.log(request.method + ' ' + request.url);

    next();
});

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

//ex. 4 - this function performs numerical operations on two numbers


// This function will make the server listen 24/7 for incoming requests. Web servers never sleep!
myWebServer.listen(process.env.PORT);