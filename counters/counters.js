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
      if (value == null) {
        value = 1;
      }
      return this.redis.hincrby(this.global_key, this.counter_key, value, __bind(function(e, count_value) {
        this.redis.publish(this.channel, count_value);
        return this.emit("counter_incr", this.toJson(count_value));
      }, this));
    };
    Counter.prototype.incr = function(value) {
      if (value == null) {
        value = 1;
      }
      return this.redis.hincrby(this.global_key, this.counter_key, value, __bind(function(e, count_value) {
        return this.emit("counter_incr", this.toJson(count_value));
      }, this));
    };
    Counter.prototype.set = function(count_value) {
      if (count_value == null) {
        count_value = 0;
      }
      return this.redis.hset(this.global_key, this.counter_key, count_value, __bind(function(e, res) {
        if (res >= 0) {
          return this.emit("counter_change", this.toJson(count_value));
        }
      }, this));
    };
    Counter.prototype.pset = function(count_value) {
      if (count_value == null) {
        count_value = 0;
      }
      return this.redis.hset(this.global_key, this.counter_key, count_value, __bind(function(e, res) {
        if (res >= 0) {
          this.redis.publish(this.channel, count_value);
          return this.emit("counter_change", this.toJson(count_value));
        }
      }, this));
    };
    Counter.prototype.count = function() {
      return this.redis.hget(this.global_key, this.counter_key, __bind(function(e, count_value) {
        return this.emit("counter_change", this.toJson(count_value));
      }, this));
    };
    Counter.prototype.subcallback = function(channel, count_value) {
      console.log("new sub message " + channel + " " + this.channel + " counter: " + count_value);
      if (channel === this.channel) {
        return this.emit("counter_change", this.toJson(count_value));
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
    Counter.prototype.clear = function(cb) {
      if (cb == null) {
        cb = null;
      }
      return this.redis.hdel(this.global_key, this.counter_key, cb);
    };
    Counter.prototype.toString = function() {
      return "global_key= " + this.global_key + " counter_key= " + this.counter_key + " channel= " + this.channel;
    };
    Counter.prototype.toJson = function(count_value) {
      return {
        global_key: this.global_key,
        counter_key: this.counter_key,
        count: count_value
      };
    };
    return Counter;
  })();
  exports.SetCounter = (function() {
    __extends(SetCounter, EventEmitter);
    function SetCounter() {
      this.emitSetincr = __bind(this.emitSetincr, this);
      SetCounter.__super__.constructor.apply(this, arguments);
    }
    SetCounter.prototype.incrSet = function(id) {
      return this.redis.sadd("set:" + counter_key, id, __bind(function(e, res) {
        if (res > 0) {
          return this.redis.scard("set:" + counter_key, e, this.emitSetincr);
        }
      }, this));
    };
    SetCounter.prototype.emitSetincr = function(err, count) {
      return this.emit("counter_change", this.toJson(count));
    };
    return SetCounter;
  })();
}).call(this);
