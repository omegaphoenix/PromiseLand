'use strict';
import myasyncmapLimit from './async-mapLimit';
const readline = require('readline');
// request library to retrieve info from github API
const request = require('request');
// Create interface for I/O streams
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const async = require('async');

function hidden(query, callback) {
  'use strict';
  const stdin = process.openStdin();
  let i = 0;
  process.stdin.on('data', char => {
    char = char + '';
    switch (char) {
      case '\n':
      case '\r':
      case '\u0004':
        stdin.pause();
        break;
      default:
        process.stdout.write('\u001B[2K\u001B[200D'+query+'['+((i%2==1)?'=-':'-=')+']');
        i++;
        break;
      }
    });
    rl.question(query, value => {
      rl.history = rl.history.slice(1);
      callback(value);
    });
}

async.waterfall([
    // Store username to look up
    function(callback) {
      rl.question('Input github username to lookup\n', data => {
        rl.pause();
        data = data.replace(/\n/g, '');
        rl.resume();
        callback(null, data);
      });
    },
    // Store username to use to authenticate
    function(data, callback) {
      rl.question('Input your github username\n', user => {
        rl.pause();
        user = user.replace(/\n/g, '');
        rl.resume();
        callback(null, data, user);
      });
    },
    // Store password for authentication
    function(data, user, callback) {
      hidden('Password: ', pass => {
        pass = pass.replace(/\n/g, '');
        rl.close();
        callback(null, data, user, pass);
      });
    },
    // Get data about the requested user's repositories
    function(data, user, pass, callback) {
      let options = {
        url: 'https://api.github.com/users/' + data + '/repos',
        headers: {
          'User-Agent': 'request'
        },
        'auth': {
          'user': user,
          'pass': pass
        }
      };
      request(options, (error, response, repos_data) => {
        if (response.statusCode !== 200) {
          console.log('Error:' +  JSON.stringify(error));
        }
        repos_data = JSON.parse(repos_data);
        callback(null, data, user, pass, options, repos_data);
      });
    },
    // Add repos
    function(data, user, pass, options, repos_data, callback) {
      let ans = {name: data};
      myasyncmapLimit(repos_data, 1, function(repo_obj, doneCallback) {
        let repo = {};
        repo.repoName = repo_obj.name;
        options.url = 'https://api.github.com/repos/' + data + '/' + repo.repoName + '/contributors';
        request(options, (error, response, contributors_data) => {
          contributors_data = JSON.parse(contributors_data);
          myasyncmapLimit(contributors_data, 1, function(contributors_obj, doneContrCallback) {
            options.url = 'https://api.github.com/users/' + contributors_obj.login;
            request(options, (indv_error, indv_response, indv_user_data) => {
              indv_user_data = JSON.parse(indv_user_data);
              if (indv_user_data.name !== null) {
                doneContrCallback(null, indv_user_data.name);
              }
              else {
                doneContrCallback(null, indv_user_data.login);
              }
            });
          }, function(err, contributors_names) {
            repo.contributors = contributors_names;
            doneCallback(null, repo);
          });
        });
      }, function(err, repos_json) {
        ans.repos = repos_json;
        callback(null, ans);
      });
    }
  ],
  function(err, ans) {
    console.log(JSON.stringify(ans));
  });
