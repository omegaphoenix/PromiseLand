export default function myasyncmap(coll, iteratee, callback) {
  var results = [];
  for (let i = 0; i < coll.length; i++) {
    iteratee(coll[i], function(err, transformed) {
      if (err === null) {
        results[i] = transformed;
        if (i == coll.length - 1) {
          callback(null, results);
        }
      }
      else {
        return callback(err, results);
      }
    });
  }
}

