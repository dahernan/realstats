(function() {
  var EventEmitter, connect, crypto, default_secret;
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  EventEmitter = require('events').EventEmitter;
  connect = require("connect");
  crypto = require('crypto');
  default_secret = "qhdyri37f";
  exports.secret = function(redis) {
    return redis.get("usid:secret", function(er, value) {
      return value;
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
    return UserSession;
  })();
}).call(this);
