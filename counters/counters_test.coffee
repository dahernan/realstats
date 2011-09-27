vows = require('vows')
util = require("util")
assert = require('assert')
redis = require("redis")
counters = require("./counters.js")
r = redis.createClient()
sub = redis.createClient()
i = 0

vows.describe("Counters Test").addBatch(
	'Testing counters':
		topic: () -> 
			new counters.Counter(r, "testcounter_live","www.dahernantest.net")
		'is an object': (counter) ->
			assert.instanceOf(counter,counters.Counter)
		'it can be reset to 0':
			topic: (counter) ->
				counter.clear(@callback)
				return
			'increment a counter':
				topic: (err,counter) ->
					console.log(util.inspect(err)) if err
					#console.log("Counter " + counter.toString())
					counter.on("counter_incr", @callback)
					counter.incr(1)
					return
				'should emit the event counter_incr': (data, err) ->
					console.log(util.inspect(err)) if err
					assert.equal(data.count, 1)
					assert.equal(data.global_key, "counter:www.dahernantest.net")
					assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/")
			'get a counter value':
				topic: (err, counter) ->
					counter.on("counter_change", @callback)
					counter.count()
					return
				'should emit the counter value': (data, err) ->
					console.log(util.inspect(err)) if err
					assert.isTrue(data.count >= 1)
					assert.equal(data.global_key, "counter:www.dahernantest.net")
					assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/")
			'suscribe to a counter and publish increment':
				topic: (err, counter) ->						
					counter.on("counter_change", @callback)
					counter.subscribe(sub)
					counter.pincr()
					return
				'should emit the counter value': (data, err) ->
					console.log(util.inspect(err)) if err
					assert.equal(data.global_key, "counter:www.dahernantest.net")
					assert.equal(data.counter_key, "testcounter_live:www.dahernantest.net/")
					assert.isTrue(data.count >= 1)			
					
												
).run()