
EventEmitter = require('events').EventEmitter 

exports.clear_counters = (r) ->
	r.keys("counter:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing counter: #{key}")
				r.del(key)			
	)
	r.keys("hit:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing hit: #{key}")
				r.del(key)			
	)

class exports.Counter extends EventEmitter
	constructor: (@redis, @counter_name, @url, @path="/") ->
		@global_key = "counter:#{@url}"
		@counter_key = "#{@counter_name}:#{@url}#{@path}"
		@channel = "channel:#{@global_key}:#{@counter_key}"
		@emit("newCounter", @url)
		@sub = null
		if not url?
			console.log("ERROR: url null creating a counter !!!!")
		
	pincr: (value = 1) ->
		@redis.hincrby(@global_key, @counter_key, value, (e, count_value) =>
			@redis.publish(@channel , count_value)
			@emit("counter_incr", @toJson(count_value))
		)
	incr: (value = 1) ->
		@redis.hincrby(@global_key, @counter_key, value, (e, count_value) =>
			@emit("counter_incr", @toJson(count_value))
		)
	set: (count_value = 0) ->
		@redis.hset(@global_key, @counter_key, count_value, (e, res) =>
			if res >= 0
				@emit("counter_change", @toJson(count_value))
		)
	pset: (count_value = 0) ->
		@redis.hset(@global_key, @counter_key, count_value, (e, res) =>
			if res >= 0
				@redis.publish(@channel , count_value)		
				@emit("counter_change", @toJson(count_value))
		)
	count: () ->
		@redis.hget(@global_key, @counter_key, (e, count_value) =>
			@emit("counter_change", @toJson(count_value))
		)
	
	subcallback: (channel, count_value) =>
		console.log("new sub message #{channel} #{@channel} counter: #{count_value}")		
		@emit("counter_change", @toJson(count_value)) if channel is @channel
		
	subscribe: (sub) ->
		@sub = sub
		@sub.subscribe(@channel)
		@sub.on('message', @subcallback)
			
		
	unsubscribe: () ->
		@sub.unsubscribe(@channel)
		@sub.removeListener('message', @subcallback)
		@sub = null
	
	clear: (cb = null) ->
		@redis.hdel(@global_key, @counter_key, cb)
	
	toString: () ->
		"global_key= #{@global_key} counter_key= #{@counter_key} channel= #{@channel}"
	
	toJson: (count_value) ->
		{global_key: @global_key, counter_key: @counter_key,  count: count_value}
		

class exports.SetCounter extends EventEmitter
	incr: (id) ->
		@redis.sadd("setcounter:#{counter_key}", id, (e, res) =>
			if(res > 0)
				@redis.scard("setcounter:#{counter_key}", e, @emitSetincr)
				
		)
	pincr: (id) ->
		@redis.sadd("setcounter:#{counter_key}", id, (e, res) =>
			if(res > 0)
				@redis.scard("setcounter:#{counter_key}", e, @emitSetincrAndPublish)
		)
	emitSetincr: (err, count) =>
		@emit("counter_change", @toJson(count))
	
	emitSetincrAndPublish: (err, count) =>
		@emit("counter_change", @toJson(count))
		@redis.publish(@channel , count_value)			
		
		
		

