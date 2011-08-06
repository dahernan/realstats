(function() {
  var handleRedisError, io, r, redis, util;
  util = require("util");
  redis = require("redis");
  r = redis.createClient();
  io = require('socket.io').listen(8082);
  handleRedisError = function(err) {
    return console.log("Error " + err);
  };
  r.on("error", handleRedisError);
  io.sockets.on('connection', function(socket) {
    var sub, url;
    sub = redis.createClient();
    sub.on("error", handleRedisError);
    url = null;
    socket.on('start', function(data) {
      url = data.url;
      console.log("new client connected " + socket.id + " " + data);
      r.hget("counter:" + data.url, "" + data.url, function(e, value) {
        return socket.emit("update", {
          count: value
        });
      });
      return sub.subscribe("channel:counter:" + data.url);
    });
    socket.on('disconnect', function() {
      console.log("client disconnected " + socket.id);
      return sub.unsubscribe("channel:counter:" + url);
    });
    return sub.on('message', function(channel, message) {
      console.log("new redis msg " + channel + " " + message);
      if (channel === ("channel:counter:" + url)) {
        return socket.emit("update", {
          channel: channel,
          count: message
        });
      }
    });
  });
}).call(this);
