
module.exports = function (t, actual, expected) {
  var actualPost = {};
  var expectedPost = {};

  Object.keys(actual).forEach(function (name) {
    var ac = actual[name];

    if (ac instanceof Error) {
      actualPost[name] = { name: ac.name, message: ac.message };
    } else if (Buffer.isBuffer(ac)) {
      actualPost[name] = '<Buffer ' + ac.toString('hex') + '>';
    } else {
      actualPost[name] = ac;
    }
  });

  Object.keys(expected).forEach(function (name) {
    var ex = expected[name];

    if (ex instanceof Error) {
      expectedPost[name] = { name: ex.name, message: ex.message };
    } else if (Buffer.isBuffer(ex)) {
      expectedPost[name] = '<Buffer ' + ex.toString('hex') + '>';
    } else {
      expectedPost[name] = ex;
    }
  });

  t.deepEqual(actualPost, expectedPost);
};
