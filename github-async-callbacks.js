const readline = require('readline');
// request library to retrieve info from github API
const request = require('request');
// Create interface for I/O streams
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function hidden(query, callback) {
  "use strict";
  const stdin = process.openStdin();
  let i = 0;
  process.stdin.on("data", char => {
    char = char + "";
    switch (char) {
      case "\n":
      case "\r":
      case "\u0004":
        stdin.pause();
        break;
      default:
        process.stdout.write("\u001B[2K\u001B[200D"+query+"["+((i%2==1)?"=-":"-=")+"]");
        i++;
        break;
      }
    });
    rl.question(query, value => {
      rl.history = rl.history.slice(1);
      callback(value);
    });
}

rl.question("Input github username to lookup.\n", data => {
  "use strict";
  rl.pause();
  // Store username to look up
  data = data.replace(/\n/g, '');
  rl.resume();
  rl.question("Input your github username.\n", user => {
    rl.pause();
    // Store username to use to authenticate
    user = user.replace(/\n/g, '');
    rl.resume();
    hidden("Password: ", pass => {
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
      request(options, (repos_error, repos_response, repos_data) => {
        repos_data = JSON.parse(repos_data);
        let ans = {name: data};
        let repositories = [];
        // Iterate through repositories
        for (let i = 0; i < repos_data.length; i++) {
          let repo = {};
          repo.repoName = repos_data[i].name;
          repo.contributors = [];
          options.url = 'https://api.github.com/repos/' + data + '/' + repo.repoName + '/contributors';
          request(options, (contributors_error, contributors_response, contributors_data) => {
            contributors_data = JSON.parse(contributors_data);
            // Iterate through collaborators of each repo
            for (let j = 0; j < contributors_data.length; j++) {
              options.url = 'https://api.github.com/users/' + contributors_data[j].login;
              request(options, (indv_error, indv_response, indv_user_data) => {
                indv_user_data = JSON.parse(indv_user_data);
                // Same name if exists.  Otherwise add username.
                if (indv_user_data.name !== null) {
                  repo.contributors.push(indv_user_data.name);
                }
                else {
                  repo.contributors.push(indv_user_data.login);
                }
                // After loop completes, push
                if (j === contributors_data.length - 1) {
                  repositories.push(repo);
                  // Might miss last contributor in last repo
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
