(function() {
  var counters, handleRedisError, io, r, redis, util;
  util = require("util");
  redis = require("redis");
  counters = require('../counters/counters.js');
  r = redis.createClient();
  io = require('socket.io').listen(8082);
  handleRedisError = function(err) {
    return console.log("Error " + err);
  };
  r.on("error", handleRedisError);
  io.sockets.on('connection', function(socket) {
    var counter, sub;
    sub = redis.createClient();
    sub.on("error", handleRedisError);
    counter = null;
    socket.on('start', function(data) {
      var url;
      console.log("new client connected " + socket.id + " " + data);
      url = data.url;
      counter = new counters.Counter(r, "views_live", url);
      counter.subscribe(sub);
      counter.on("counter_change", function(change) {
        console.log("counter_change!   " + change.global_key + "  " + change.counter_key + " " + change.count);
        return socket.emit("update", {
          count: change.count
        });
      });
      return counter.count();
    });
    return socket.on('disconnect', function() {
      console.log("client disconnected " + socket.id);
      counter.unsubscribe();
      return sub.quit();
    });
  });
}).call(this);
