(function() {
  var app, counters, express, handleRedisError, io, r, redis, sio, util;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  util = require("util");
  redis = require("redis");
  counters = require('../counters/counters.js');
  express = require('express');
  sio = require('socket.io');
  r = redis.createClient();
  app = module.exports = express.createServer();
  app.configure(function() {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(app.router);
    return app.use(express.static(__dirname + '/public'));
  });
  app.configure('development', function() {
    return app.use(express.errorHandler({
      dumpExceptions: true,
      showStack: true
    }));
  });
  app.configure('production', function() {
    return app.use(express.errorHandler());
  });
  app.get('/', function(req, res) {
    return res.render('index', {
      title: 'Express'
    });
  });
  app.listen(8082);
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
  handleRedisError = function(err) {
    return console.log("Error " + err);
  };
  r.on("error", handleRedisError);
  io = sio.listen(app);
  io.sockets.on('connection', function(socket) {
    var sub, users_live, views_live;
    sub = redis.createClient();
    sub.on("error", handleRedisError);
    views_live = null;
    users_live = null;
    socket.on('start', function(data) {
      var counter_change, url;
      console.log("new client connected " + socket.id + " " + data);
      url = data.url;
      views_live = new counters.Counter(r, "views_live", url);
      users_live = new counters.Counter(r, "users_live", url);
      views_live.subscribe(sub);
      users_live.subscribe(sub);
      counter_change = __bind(function(change) {
        console.log("counter_change!   " + change.global_key + "  " + change.counter_key + " " + change.count);
        return socket.emit("update", {
          counter: change.counter_key,
          count: change.count
        });
      }, this);
      views_live.on("counter_change", counter_change);
      users_live.on("counter_change", counter_change);
      views_live.count();
      return users_live.count();
    });
    return socket.on('disconnect', function() {
      console.log("client disconnected " + socket.id);
      if (views_live != null) {
        views_live.unsubscribe();
      }
      if (users_live != null) {
        users_live.unsubscribe();
      }
      return sub.quit();
    });
  });
}).call(this);
