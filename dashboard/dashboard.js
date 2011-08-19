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
    var sub, users_live, views_live;
    sub = redis.createClient();
    sub.on("error", handleRedisError);
    views_live = null;
    users_live = null;
    socket.on('start', function(data) {
      var url;
      console.log("new client connected " + socket.id + " " + data);
      url = data.url;
      views_live = new counters.Counter(r, "views_live", url);
      users_live = new counters.Counter(r, "users_live", url);
      views_live.subscribe(sub);
      users_live.subscribe(sub);
      views_live.on("counter_change", function(change) {
        console.log("counter_change!   " + change.global_key + "  " + change.counter_key + " " + change.count);
        return socket.emit("update", {
          count: change.count
        });
      });
      users_live.on("counter_change", function(change) {
        console.log("counter_change!   " + change.global_key + "  " + change.counter_key + " " + change.count);
        return socket.emit("update", {
          count: change.count
        });
      });
      views_live.count();
      return users_live.count();
    });
    return socket.on('disconnect', function() {
      console.log("client disconnected " + socket.id);
      views_live.unsubscribe();
      users_live.unsubscribe();
      return sub.quit();
    });
  });
}).call(this);
