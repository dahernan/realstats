(function() {
  var EventEmitter, connect, crypto, default_secret, util;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  EventEmitter = require('events').EventEmitter;
  connect = require("connect");
  crypto = require('crypto');
  util = require("util");
  default_secret = "qhdyri37f";
  exports.secret = function(redis) {
    return redis.get("usid:secret", function(er, value) {
      return value;
    });
  };
  exports.clear_session = function(r) {
    return r.keys("usid:*", function(err, keys) {
      var key, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = keys.length; _i < _len; _i++) {
        key = keys[_i];
        _results.push((function(key) {
          console.log("Clearing session: " + key);
          return r.del(key);
        })(key));
      }
      return _results;
    });
  };
  exports.UserSession = (function() {
    __extends(UserSession, EventEmitter);
    function UserSession(redis, usid) {
      this.redis = redis;
      this.usid = usid;
      if (!(this.usid != null)) {
        this.generate_usid();
      }
      this.global_key = "usid:" + this.usid;
    }
    UserSession.prototype.generate_usid = function() {
      var suid;
      suid = connect.utils.uid(128);
      this.usid = connect.utils.md5(suid);
      return console.log("suid generated " + this.usid);
    };
    UserSession.prototype.value = function() {
      return this.emit("new_usid", {
        usid: this.usid
      });
    };
    UserSession.prototype.hit = function(url) {
      this.redis.hset(this.global_key, url, new Date());
      this.redis.zincrby("usid:set:" + url, 1, this.global_key, __bind(function(er, score) {
        console.log("SCORE: usid:set:" + url + " key " + this.global_key + " score: " + score);
        if (parseInt(score) === 1) {
          return this.emit("session_start", {
            usid: this.usid,
            url: url
          });
        }
      }, this));
      return this.emit("hit", {
        usid: this.usid,
        url: url
      });
    };
    UserSession.prototype.leave = function(url) {
      this.redis.zincrby("usid:set:" + url, -1, this.global_key, __bind(function(er, score) {
        console.log("SCORE: usid:set:" + url + " key " + this.global_key + " score: " + score);
        if (parseInt(score) <= 0) {
          this.emit("session_end", {
            usid: this.usid,
            url: url
          });
          return this.redis.zrem("usid:set:" + url, this.global_key);
        }
      }, this));
      this.redis.hget(this.global_key, url, __bind(function(e, value) {
        return this.redis.hset(this.global_key, url, new Date() - value);
      }, this));
      return this.emit("leave", {
        usid: this.usid,
        url: url
      });
    };
    return UserSession;
  })();
}).call(this);
