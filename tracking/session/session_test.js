(function() {
  var assert, i, r, redis, session, sub, util, vows;
  vows = require('vows');
  util = require("util");
  assert = require('assert');
  redis = require("redis");
  session = require("./session.js");
  r = redis.createClient();
  sub = redis.createClient();
  i = 0;
  vows.describe("Session Test").addBatch({
    'Testing user session generation and hits': {
      topic: function() {
        return new session.UserSession(r);
      },
      'is an object': function(sid) {
        return assert.instanceOf(sid, session.UserSession);
      },
      'when value is invoked': {
        topic: function(sid) {
          sid.on("new_usid", this.callback);
          sid.value();
        },
        'should emit the event new_usid with the user id as a data': function(data, err) {
          if (err) {
            console.log(util.inspect(err));
          }
          return assert.isTrue(data.usid.length > 0);
        }
      },
      'hit an url': {
        topic: function(sid) {
          sid.on("session_start", this.callback);
          sid.hit("www.dahernantest.net");
        },
        'should emit start a session event': function(data, err) {
          if (err) {
            console.log(util.inspect(err));
          }
          console.log(data.url);
          assert.equal("www.dahernantest.net", data.url);
          return assert.isTrue(data.usid.length > 0);
        }
      },
      'leave an url': {
        topic: function(sid) {
          console.log("yeeeeeeeeeeeeeeeeep");
          sid.on("session_end", this.callback);
          sid.leave("www.dahernantest.net");
        },
        'should emit end session for that url event': function(data, err) {
          if (err) {
            console.log(util.inspect(err));
          }
          assert.equal("www.dahernantest.net", data.url);
          return assert.isTrue(data.usid.length > 0);
        }
      }
    }
  }).run();
}).call(this);
