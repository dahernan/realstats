(function() {
  var clear_counters, increment_pcounter, io, r, redis, store_handshake, trackutils, util;
  util = require("util");
  redis = require("redis");
  trackutils = require("../trackutils/trackutils.js");
  io = require('socket.io').listen(8080);
  r = redis.createClient();
  r.on("error", function(err) {
    return console.log("Error " + err);
  });
  clear_counters = function(r) {
    return r.keys("counter:*", function(err, keys) {
      var key, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        _results.push((function(key) {
          console.log("Clearing counter: " + key);
          return r.del(key);
        })(key));
      }
      return _results;
    });
  };
  increment_pcounter = function(r, url, incr) {
    return r.hincrby("counter:" + url, url, incr, function(e, counter_value) {
      return r.publish("channel:counter:" + url, counter_value);
    });
  };
  store_handshake = function(r, socket) {
    r.hset(socket.id, "time", socket.handshake.time);
    r.hset(socket.id, "address", socket.handshake.address.address);
    r.hset(socket.id, "referer", socket.handshake.referer);
    r.hset(socket.id, "user-agent", socket.handshake.headers["user-agent"]);
    r.hset(socket.id, "accept-language", socket.handshake.headers["accept-language"]);
    r.hset(socket.id, "cookie", socket.handshake.headers["cookie"]);
    return r.hset(socket.id, "handshake_host", socket.handshake.headers["host"]);
  };
  clear_counters(r);
  io.sockets.on('connection', function(socket) {
    console.log("new client with id " + util.inspect(socket.handshake, true, null));
    store_handshake(r, socket);
    socket.on('new_client', function(data) {
      var uri;
      console.log("navigator data: " + data.url);
      uri = trackutils.parseUri(data.url);
      increment_pcounter(r, uri.host, 1);
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
        console.log(host);
        increment_pcounter(r, host, -1);
        return r.hget(socket.id, "path", function(err, path) {
          return r.hincrby("counter:" + host, host + path, -1);
        });
      });
    });
  });
}).call(this);
