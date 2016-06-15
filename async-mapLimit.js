// function to imitate async.mapLimit
export default function myasyncmapLimit(coll, lim, iteratee, callback) {
  let results = [];
  let i = 0;
  let running = 0;
  let completed = 0;
  var loop = function() {
    while (running < lim && i < coll.length) {
      console.log(i);
      running++;
      iteratee(coll[i], function(func_err, transformed) {
        if (func_err === null) {
          completed++;
          running--;
          results.push(transformed);
          if (completed >= coll.length) {
            callback(null, results);
          }
          else {
            loop();
          }
        }
        else {
          return callback(err);
        }
      });
      i++;
    }
  };
  loop();
};
