export default function myasyncmapLimit(coll, lim, iteratee, callback) {
  var results = [];
  let i = 0;
  let num_running = 0;
  while (i < coll.length) {
      incrementCounter(num_running, lim, function (counter) {
        num_running = counter;
        iteratee(coll[i], function(err, transformed) {
          if (err === null) {
            results[i] = transformed;
            if (i == coll.length - 1) {
              callback(null, results);
            }
            i++;
            num_running--;
          }
          else {
            return callback(err, results);
          }
        });
      });
  }
}


function incrementCounter(counter, lim, callback) {
  if (counter < lim) {
    counter++;
    callback(counter);
    console.log("counter = " + counter);
  }
}
