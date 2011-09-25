vows = require('vows')
util = require("util")
assert = require('assert')
redis = require("redis")
counters = require("./counters.js")
r = redis.createClient()
sub = redis.createClient()

counters.clear_counters(r)

vows.describe("Counters Test").addBatch(
	'Create a new counter':
		topic: () -> 
			new counters.Counter(r, "testcounter_live","www.dahernantest.net")
		'is an object': (counter) ->
			assert.instanceOf(counter,counters.Counter)
		'increment a counter':
			topic: (counter) ->
				counter.on("counter_incr", @callback)
				counter.incr(1)
				return
			'should emit the event counter_incr': (data, err) ->
				console.log(util.inspect(err)) if err
				console.log("Response: #{data}" ) if data
				assert.equal(data.count, 1)
				assert.equal(data.global_key, "counter:www.dahernantest.net")
				assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/")
				
).run()