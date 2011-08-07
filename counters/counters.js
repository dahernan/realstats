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
  exports.Counter = (function() {
    __extends(Counter, EventEmitter);
    function Counter(redis, url, path) {
      this.redis = redis;
      this.url = url;
      this.path = path != null ? path : "/";
      this.subcallback = __bind(this.subcallback, this);
      this.name = "counter:" + url;
      this.channel = "channel:" + this.name;
      this.emit("newCounter", this.url);
      this.sub = null;
    }
    Counter.prototype.incr = function(value) {
      return this.redis.hincrby(this.name, this.url, value, __bind(function(e, counter_value) {
        this.redis.publish(this.channel, counter_value);
        return this.emit("counter_incr", counter_value);
      }, this));
    };
    Counter.prototype.count = function() {
      return this.redis.hget(this.name, this.url, __bind(function(e, value) {
        return this.emit("counter_change", value);
      }, this));
    };
    Counter.prototype.subcallback = function(channel, value) {
      console.log("new sub message " + channel + " " + value + " " + this.channel);
      if (channel === this.channel) {
        return this.emit("counter_change", value);
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
