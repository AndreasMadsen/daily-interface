
module.exports = function now() {
  var curr = Date.now();
  return {
    'second': Math.floor(curr / 1000),
    'millisecond': curr % 1000
  };
};
