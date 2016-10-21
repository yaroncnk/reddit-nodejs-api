var bcrypt = require('bcrypt');
var HASH_ROUNDS = 10;

module.exports = function RedditAPI(conn) {
  return {
    createUser: function(user, callback) {

      // first we have to hash the password...
      bcrypt.hash(user.password, HASH_ROUNDS, function(err, hashedPassword) {
        if (err) {
          callback(err);
        }
        else {
          conn.query(
            'INSERT INTO users (username,password, createdAt) VALUES (?, ?, ?)', [user.username, hashedPassword, new Date()],
            function(err, result) {
              if (err) {
                /*
                There can be many reasons why a MySQL query could fail. While many of
                them are unknown, there's a particular error about unique usernames
                which we can be more explicit about!
                */
                if (err.code === 'ER_DUP_ENTRY') {
                  callback(new Error('A user with this username already exists'));
                }
                else {
                  callback(err);
                }
              }
              else {
                /*
                Here we are INSERTing data, so the only useful thing we get back
                is the ID of the newly inserted row. Let's use it to find the user
                and return it
                */
                conn.query(
                  'SELECT id, username, createdAt, updatedAt FROM users WHERE id = ?', [result.insertId],
                  function(err, result) {
                    if (err) {
                      callback(err);
                    }
                    else {
                      /*
                      Finally! Here's what we did so far:
                      1. Hash the user's password
                      2. Insert the user in the DB
                      3a. If the insert fails, report the error to the caller
                      3b. If the insert succeeds, re-fetch the user from the DB
                      4. If the re-fetch succeeds, return the object to the caller
                      */
                      callback(null, result[0]);
                    }
                  }
                );
              }
            }
          );
        }
      });
    },
    createPost: function(post, subredditId, callback) {
      conn.query(
        'INSERT INTO posts (userId, title, url, createdAt, subredditId) VALUES (?, ?, ?, ?, ?)', [post.userId, post.title, post.url, new Date(), subredditId],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Post inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id,title,url,userId, createdAt, updatedAt, subredditId FROM posts WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getAllPosts: function(options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      //this function returns all posts, including information about the user (owner)
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      conn.query(`
        SELECT  p.id as postId, p.title as postTitle, p.url as postURL, p.createdAt as postCreatedAt , p.updatedAt as postUpdatedAt , p.userId as userId, u.id user_id , u.username as username, u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt, p.subredditId as subreddit, s.name as redditName, s.description as redditDescription
        FROM posts p LEFT JOIN users u ON (u.id=p.userId) LEFT JOIN subreddits s ON (p.subredditId = s.id)
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            //here we create a new object that will store everything we need in the structure we want
            var new_results = results.map(function(postsByUser) {
              return {
                id: postsByUser.postId,
                title: postsByUser.postTitle,
                url: postsByUser.postURL,
                createdAt: postsByUser.postCreatedAt,
                updatedAt: postsByUser.postUpdatedAt,
                user: {
                  id: postsByUser.user_id,
                  username: postsByUser.username,
                  userCreatedAt: postsByUser.userCreatedAt,
                  userUptedAt: postsByUser.userUpdatedAt
                },
                subreddit: {
                  id: postsByUser.subreddit,
                  name: postsByUser.redditName,
                  description: postsByUser.redditDescription
                }
              };

            })
            callback(null, new_results);

          }
        }
      );
    },
    getAllPostsForUser: function(userId, options, callback) {
      // In case we are called without an options parameter, shift all the parameters manually
      // Thi function returns all the posts per user
      if (!callback) {
        callback = options;
        options = {};
      }
      var limit = options.numPerPage || 25; // if options.numPerPage is "falsy" then use 25
      var offset = (options.page || 0) * limit;

      conn.query(`
        SELECT  p.id as postId, p.title as postTitle, p.url as postURL, p.createdAt as postCreatedAt , p.updatedAt as postUpdatedAt , p.userId as userId, u.id user_id , u.username as username, u.createdAt as userCreatedAt, u.updatedAt as userUpdatedAt
        FROM posts p JOIN users u ON (u.id=p.userId)
        WHERE u.id = ${userId} 
        ORDER BY p.createdAt DESC
        LIMIT ? OFFSET ?`, [limit, offset],
        function(err, results) {
          if (err) {
            callback(err);
          }
          else {
            var new_results = results.map(function(postsByUser) {
              return {
                id: postsByUser.user_id,
                username: postsByUser.username,
                userCreatedAt: postsByUser.userCreatedAt,
                userUptedAt: postsByUser.userUpdatedAt,
                posts: {
                  id: postsByUser.post_id,
                  title: postsByUser.post_title,
                  url: postsByUser.postURL,
                  createdAt: postsByUser.postCreatedAt,
                  updatedAt: postsByUser.postUpdatedAt
                }
              };

            })
            callback(null, new_results);

          }
        }
      );
    },

    getSinglePost: function(postId, callback) {
      // This function takes a post ID and returns a single post

      conn.query(`
        SELECT  p.id as postId, p.title as postTitle, p.url as postURL, p.createdAt as postCreatedAt , p.updatedAt as postUpdatedAt , p.userId as userId
        FROM posts p 
        WHERE p.id = ${postId} `,

        function(err, results) {
          if (err) {
            callback(err);
          }
          else {


            callback(null, results[0]);

          }
        }
      );
    },
    createSubReddit: function(sub, callback) {
      //this function takes a subreddit and adds it to the subreddits table

      conn.query(
        'INSERT INTO subreddits (id, name, description, createdAt) VALUES (?, ?, ?, ?)', [sub.id, sub.name, sub.description || '', new Date()],
        function(err, result) {
          if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
              callback(new Error('A subreddit with this username already exists'));
            }
            else {
              callback(err);
            }
          }
          else {
            /*
            Subreddit inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */
            conn.query(
              'SELECT id,name, description, createdAt, updatedAt FROM subreddits WHERE id = ?', [result.insertId],
              function(err, result) {
                if (err) {
                  callback(err);
                }
                else {
                  callback(null, result[0]);
                }
              }
            );
          }
        }
      );
    },
    getAllSubreddits: function(callback) {
      // This function returns all subreddits

      conn.query(`
        SELECT  p.id as postId, p.title as postTitle, p.url as postURL, p.createdAt as postCreatedAt , p.updatedAt as postUpdatedAt , p.userId as userId
        FROM posts p 
        ORDER BY p.createdAt DESC `,

        function(err, results) {
          if (err) {
            callback(err);
          }
          else {


            callback(null, results);

          }
        }
      );
    },
    createOrUpdateVote: function(vote, callback) {
      //this function taks an object with votes and adds it to the votes table
      //the vote can be either added or updated
      if  (vote.vote != 1 || vote.vote != 0 || vote.vote != -1) {
      conn.query(
        'INSERT INTO votes (userId, postId, vote, createdAt) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE `vote`= ?', 
        [vote.userId, vote.postId, vote.vote, new Date(), vote.vote],
        function(err, result) {
          if (err) {
            callback(err);
          }
          else {
            /*
            Vote inserted successfully. Let's use the result.insertId to retrieve
            the post and send it to the caller!
            */

         
              conn.query(
                'SELECT userId,postId, vote, createdAt, updatedAt FROM votes ', [result.insertId],
                function(err, result) {
                  if (err) {
                    callback(err);
                  }
                  else {
                    callback(null, result);
                  }
                
                }
                );
          
        
        }
      }
      );
    } else {
      console.log('invalid value');
    }

  }
}
}