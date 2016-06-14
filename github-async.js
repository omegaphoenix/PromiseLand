const readline = require('readline');
// request library to retrieve info from github API
const request = require('request');
// Create interface for I/O streams
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hidden(query, callback) {
  const stdin = process.openStdin();
  var i = 0;
  process.stdin.on("data", function(char) {
    char = char + "";
    switch (char) {
      case "\n":
      case "\r":
      case "\u0004":
        stdin.pause();
        break;
      default:
        process.stdout.write("\033[2K\033[200D"+query+"["+((i%2==1)?"=-":"-=")+"]");
        i++;
        break;
      }
    });
    rl.question(query, function(value) {
      rl.history = rl.history.slice(1);
      callback(value);
    });
}

rl.question("Input github username to lookup.\n", function(data) {
  "use strict";
  rl.pause();
  // Store username to look up
  data = data.replace(/\n/g, '');
  rl.resume();
  rl.question("Input your github username.\n", function(user) {
    rl.pause();
    // Store username to use to authenticate
    user = user.replace(/\n/g, '');
    rl.resume();
    hidden("Password: ", function(pass) {
      // Store password for authentication
      pass = pass.replace(/\n/g, '');
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
      // Get data about the requested user's repositories
      request(options, function (error, response, body) {
        body = JSON.parse(body);
        let ans = {name: data};
        let repositories = [];
        // Iterate through repositories
        for (let i = 0; i < body.length; i++) {
          let repo = {};
          repo.repoName = body[i].name;
          repo.contributors = [];
          options.url = 'https://api.github.com/repos/' + data + '/' + repo.repoName + '/contributors';
          request(options, function (error2, response2, body2) {
            body2 = JSON.parse(body2);
            // Iterate through collaborators of each repo
            for (let j = 0; j < body2.length; j++) {
              options.url = 'https://api.github.com/users/' + body2[j].login;
              request(options, function (error3, response3, body3) {
                body3 = JSON.parse(body3);
                // Same name if exists.  Otherwise add username.
                if (body3.name !== null) {
                  repo.contributors.push(body3.name);
                }
                else {
                  repo.contributors.push(body3.login);
                }
                // After loop completes, push
                if (j === body2.length - 1) {
                  repositories.push(repo);
                  if (i === body.length - 1) {
                   ans.repos = repositories;
                   console.log(JSON.stringify(ans));
                  }
                }
              });
            }
          });
        }
      });
      rl.close();
    });
  });
});
