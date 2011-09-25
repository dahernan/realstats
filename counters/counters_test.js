(function() {
  var assert, counters, r, redis, sub, util, vows;
  vows = require('vows');
  util = require("util");
  assert = require('assert');
  redis = require("redis");
  counters = require("./counters.js");
  r = redis.createClient();
  sub = redis.createClient();
  counters.clear_counters(r);
  vows.describe("Counters Test").addBatch({
    'Create a new counter': {
      topic: function() {
        return new counters.Counter(r, "testcounter_live", "www.dahernantest.net");
      },
      'is an object': function(counter) {
        return assert.instanceOf(counter, counters.Counter);
      },
      'increment a counter': {
        topic: function(counter) {
          counter.on("counter_incr", this.callback);
          counter.incr(1);
        },
        'should emit the event counter_incr': function(data, err) {
          if (err) {
            console.log(util.inspect(err));
          }
          if (data) {
            console.log("Response: " + data);
          }
          assert.equal(data.count, 1);
          assert.equal(data.global_key, "counter:www.dahernantest.net");
          return assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/");
        }
      }
    }
  }).run();
}).call(this);
