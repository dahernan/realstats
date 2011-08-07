(function() {
  var counters, io, r, redis, store_handshake, trackutils, util;
  util = require("util");
  redis = require("redis");
  trackutils = require("../trackutils/trackutils.js");
  io = require('socket.io').listen(8080);
  counters = require('../counters/counters.js');
  r = redis.createClient();
  r.on("error", function(err) {
    return console.log("Error " + err);
  });
  store_handshake = function(r, socket) {
    r.hset(socket.id, "time", socket.handshake.time);
    r.hset(socket.id, "address", socket.handshake.address.address);
    r.hset(socket.id, "referer", socket.handshake.referer);
    r.hset(socket.id, "user-agent", socket.handshake.headers["user-agent"]);
    r.hset(socket.id, "accept-language", socket.handshake.headers["accept-language"]);
    r.hset(socket.id, "cookie", socket.handshake.headers["cookie"]);
    return r.hset(socket.id, "handshake_host", socket.handshake.headers["host"]);
  };
  counters.clear_counters(r);
  io.sockets.on('connection', function(socket) {
    console.log("new client with id " + util.inspect(socket.handshake, true, null));
    store_handshake(r, socket);
    socket.on('new_client', function(data) {
      var counter, uri;
      console.log("navigator data: " + data.url);
      uri = trackutils.parseUri(data.url);
      counter = new counters.Counter(r, uri.host);
      counter.incr(1);
      if ((uri.path != null) && uri.path !== "/") {
        r.hincrby("counter:" + uri.host, uri.host + uri.path, 1);
      }
      r.hset(socket.id, "host", uri.host);
      return r.hset(socket.id, "path", uri.path);
    });
    socket.on('destroy_client', function(data) {
      return console.log(data);
    });
    return socket.on('disconnect', function() {
      console.log("user disconnected buuuuuuu " + socket.id);
      return r.hget(socket.id, "host", function(err, host) {
        var counter;
        console.log(host);
        counter = new counters.Counter(r, host);
        counter.incr(-1);
        return r.hget(socket.id, "path", function(err, path) {
          return r.hincrby("counter:" + host, host + path, -1);
        });
      });
    });
  });
}).call(this);
