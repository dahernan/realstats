
EventEmitter = require('events').EventEmitter 

exports.clear_counters = (r) ->
	r.keys("counter:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing counter: #{key}")
				r.del(key)			
	)

class exports.Counter extends EventEmitter
	constructor: (@redis, @counter_name, @url, @path="/") ->
		@global_key = "counter:#{@url}"
		@counter_key = "#{@counter_name}:#{@url}#{@path}"
		@channel = "channel:#{@global_key}:#{@counter_key}"
		@emit("newCounter", @url)
		@sub = null
		
	pincr: (value) ->
		@redis.hincrby(@global_key, @counter_key, value, (e, count) =>
			@redis.publish(@channel , count)
			@emit("counter_incr", {global_key: @global_key, counter_key: @counter_key,  count: count})
		)
	incr: (value) ->
		@redis.hincrby(@global_key, @counter_key, value, (e, count) =>
			@emit("counter_incr", {global_key: @global_key, counter_key: @counter_key,  count: count})
		)
	count: () ->
		@redis.hget(@global_key, @counter_key, (e, count) =>
			@emit("counter_change", {global_key: @global_key, counter_key: @counter_key,  count: count})
		)
	
	subcallback: (channel, count) =>
		console.log("new sub message #{channel} #{@channel}")		
		@emit("counter_change", {global_key: @global_key, counter_key: @counter_key,  count: count}) if channel is @channel
		
	subscribe: (sub) ->
		@sub = sub
		@sub.subscribe(@channel)
		@sub.on('message', @subcallback)
			
		
	unsubscribe: () ->
		@sub.unsubscribe(@channel)
		@sub.removeListener('message', @subcallback)
		@sub = null

