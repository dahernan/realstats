(function() {
  var connect, counters, io, r, redis, server, session, sio, store_handshake, trackutils, util;
  util = require("util");
  redis = require("redis");
  trackutils = require("../trackutils/trackutils.js");
  session = require("./session/session.js");
  connect = require("connect");
  sio = require('socket.io');
  counters = require('../counters/counters.js');
  r = redis.createClient();
  r.on("error", function(err) {
    return console.log("Error " + err);
  });
  store_handshake = function(r, socket) {
    var hit;
    hit = "hit:" + socket.id;
    r.hset(hit, "time", socket.handshake.time);
    r.hset(hit, "address", socket.handshake.address.address);
    r.hset(hit, "referer", socket.handshake.referer);
    r.hset(hit, "user-agent", socket.handshake.headers["user-agent"]);
    r.hset(hit, "accept-language", socket.handshake.headers["accept-language"]);
    r.hset(hit, "cookie", socket.handshake.headers["cookie"]);
    return r.hset(hit, "handshake_host", socket.handshake.headers["host"]);
  };
  counters.clear_counters(r);
  server = connect(connect.static(__dirname + '/public'), function(req, resp) {});
  server.listen(8080);
  io = sio.listen(server);
  io.sockets.on('connection', function(socket) {
    var suid, usession;
    console.log("new client with id " + util.inspect(socket.handshake, true, null));
    store_handshake(r, socket);
    suid = trackutils.getCookie("_usid", socket.handshake.headers["cookie"]);
    console.log("new user with id " + suid);
    usession = new session.UserSession(r, suid);
    usession.on("new_usid", function(data) {
      console.log("EVENT new_usid " + data.usid);
      return socket.emit("new_usid", {
        usid: data.usid
      });
    });
    usession.value();
    socket.on('new_client', function(data) {
      var pviews_live, uri, views_live;
      uri = trackutils.parseUri(data.url);
      console.log("navigator data: " + data.url + " referrer " + data.referrer);
      r.hset("hit:" + socket.id, "host", uri.host);
      r.hset("hit:" + socket.id, "path", uri.path);
      views_live = new counters.Counter(r, "views_live", uri.host);
      views_live.pincr(1);
      pviews_live = new counters.Counter(r, "pviews_live", uri.host, uri.path);
      return pviews_live.incr(1);
    });
    return socket.on('disconnect', function() {
      var hit;
      console.log("user disconnected buuuuuu " + socket.id);
      hit = "hit:" + socket.id;
      return r.hget(hit, "host", function(err, host) {
        var views_live;
        views_live = new counters.Counter(r, "views_live", host);
        views_live.pincr(-1);
        return r.hget(hit, "path", function(e, path) {
          var pviews_live;
          console.log("=======   " + host + path);
          pviews_live = new counters.Counter(r, "pviews_live", host, path);
          pviews_live.incr(-1);
          return r.del(hit);
        });
      });
    });
  });
}).call(this);
