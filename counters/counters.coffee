
EventEmitter = require('events').EventEmitter 

exports.clear_counters = (r) ->
	r.keys("counter:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing counter: #{key}")
				r.del(key)			
	)

class exports.Counter extends EventEmitter
	constructor: (@redis, @url, @path="/") ->
		@name = "counter:#{url}"
		@channel = "channel:#{@name}"
		@emit("newCounter", @url)
		@sub = null
		
	
	incr: (value) ->
		@redis.hincrby(@name, @url, value, (e, counter_value) =>
			@redis.publish(@channel , counter_value)
			@emit("counter_incr", counter_value)
		)
	count: () ->
		@redis.hget(@name, @url, (e, value) =>
			@emit("counter_change", value)
		)
	
	subcallback: (channel, value) =>
		console.log("new sub message #{channel} #{value} #{@channel}")		
		@emit("counter_change", value) if channel is @channel
		
	subscribe: (sub) ->
		@sub = sub
		@sub.subscribe(@channel)
		@sub.on('message', @subcallback)
			
		
	unsubscribe: () ->
		@sub.unsubscribe(@channel)
		@sub.removeListener('message', @subcallback)
		@sub = null

