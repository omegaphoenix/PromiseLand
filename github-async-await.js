'use strict';
const readline = require('readline');
// request library to retrieve info from github API
const request = require('request');
// Create interface for I/O streams
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
const Promise = require('bluebird');
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

// Store username to look up
const getData = function() {
  return new Promise(function(resolve, reject) {
    rl.question('Input github username to lookup\n', data => {
      rl.pause();
      data = data.replace(/\n/g, '');
      resolve(data);
    });
  });
};

// Store username to use to authenticate
const getUser = function(data) {
  return new Promise(function(resolve, reject) {
    rl.resume();
    rl.question('Input your github username\n', user => {
      rl.pause();
      user = user.replace(/\n/g, '');
      resolve([data, user]);
    });
  });
};

// Store password for authentication
const getPass = function([data, user]) {
  return new Promise(function(resolve, reject) {
    rl.resume();
    hidden('Password: ', pass => {
      pass = pass.replace(/\n/g, '');
      rl.close();
      resolve([data, user, pass]);
    });
  });
};

// Get data about the requested user's repositories
const getRepos = function([data, user, pass]) {
  return new Promise(function(resolve, reject) {
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
        resolve([data, user, pass, options, repos_data]);
      });
    });
};

// Add repos
const addContributors = function([data, user, pass, options, repos_data]) {;
  return new Promise(function(resolve, reject) {
      let ans = {name: data};
      async.map(repos_data, function(repo_obj, doneCallback) {
        let repo = {};
        repo.repoName = repo_obj.name;
        options.url = 'https://api.github.com/repos/' + data + '/' + repo.repoName + '/contributors';
        request(options, (error, response, contributors_data) => {
          contributors_data = JSON.parse(contributors_data);
          async.map(contributors_data, function(contributors_obj, doneContrCallback) {
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
        resolve(ans);
      });
  });
};

getData().then(function(data) {
  return getUser(data);
}).then(function(data_arr) {
  return getPass(data_arr);
}).then(function(data_arr) {
  return getRepos(data_arr);
}).then(function(data_arr) {
  return addContributors(data_arr);
}).then(function(ans) {
  console.log(JSON.stringify(ans));
}).catch(function(error) {
  throw error;
});
