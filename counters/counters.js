(function() {
  var EventEmitter;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  exports.clear_counters = function(r) {
    r.keys("counter:*", function(err, keys) {
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
    return r.keys("hit:*", function(err, keys) {
      var key, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        _results.push((function(key) {
          console.log("Clearing hit: " + key);
          return r.del(key);
        })(key));
      }
      return _results;
    });
  };
  exports.Counter = (function() {
    __extends(Counter, EventEmitter);
    function Counter(redis, counter_name, url, path) {
      this.redis = redis;
      this.counter_name = counter_name;
      this.url = url;
      this.path = path != null ? path : "/";
      this.subcallback = __bind(this.subcallback, this);
      this.global_key = "counter:" + this.url;
      this.counter_key = "" + this.counter_name + ":" + this.url + this.path;
      this.channel = "channel:" + this.global_key + ":" + this.counter_key;
      this.emit("newCounter", this.url);
      this.sub = null;
      if (!(url != null)) {
        console.log("ERROR: url null creating a counter !!!!");
      }
    }
    Counter.prototype.pincr = function(value) {
      return this.redis.hincrby(this.global_key, this.counter_key, value, __bind(function(e, count) {
        this.redis.publish(this.channel, count);
        return this.emit("counter_incr", {
          global_key: this.global_key,
          counter_key: this.counter_key,
          count: count
        });
      }, this));
    };
    Counter.prototype.incr = function(value) {
      return this.redis.hincrby(this.global_key, this.counter_key, value, __bind(function(e, count) {
        return this.emit("counter_incr", {
          global_key: this.global_key,
          counter_key: this.counter_key,
          count: count
        });
      }, this));
    };
    Counter.prototype.count = function() {
      return this.redis.hget(this.global_key, this.counter_key, __bind(function(e, count) {
        return this.emit("counter_change", {
          global_key: this.global_key,
          counter_key: this.counter_key,
          count: count
        });
      }, this));
    };
    Counter.prototype.subcallback = function(channel, count) {
      console.log("new sub message " + channel + " " + this.channel);
      if (channel === this.channel) {
        return this.emit("counter_change", {
          global_key: this.global_key,
          counter_key: this.counter_key,
          count: count
        });
      }
    };
    Counter.prototype.subscribe = function(sub) {
      this.sub = sub;
      this.sub.subscribe(this.channel);
      return this.sub.on('message', this.subcallback);
    };
    Counter.prototype.unsubscribe = function() {
      this.sub.unsubscribe(this.channel);
      this.sub.removeListener('message', this.subcallback);
      return this.sub = null;
    };
    return Counter;
  })();
}).call(this);
