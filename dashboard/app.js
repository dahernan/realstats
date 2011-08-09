(function() {
  var app, counters, express, handleRedisError, io, r, redis, sio, util;
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
