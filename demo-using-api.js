// load the mysql library
var mysql = require('mysql');

// create a connection to our Cloud9 server
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'yaroncnk', // CHANGE THIS :)
  password : '',
  database: 'reddit'
});

// load our API and pass it the connection
var reddit = require('./reddit');
var redditAPI = reddit(connection);

// // // It's request time!
// redditAPI.createUser({
//   username: 'yaro',
//   password: '123'
// }, function(err, user) {
//   if (err) {
//     console.log(err);
//   }
//   else {
//     redditAPI.createPost({
//       title: 'my first post!',
//       url: 'https://www.gogole.com',
//       userId: user.id
//     }, function(err, post) {
//       if (err) {
//         console.log(err);
//       }
//       else {
        
        
        
        
        
//       }
//     });
//   }
// });

redditAPI.getSinglePost( 1, function (err,result){
  if (err) {
    console.log(err);
  }
  else {
    console.log(result);
  }
  connection.end();
})
 