
EventEmitter = require('events').EventEmitter 
connect = require("connect")
crypto = require('crypto')
util = require("util")


# exports.sha256 = (base, secret) ->
#	crypto.createHmac('sha256', secret).update(base).digest('base64').replace(/=*$/, '')



default_secret = "qhdyri37f"

exports.secret = (redis) ->
	redis.get("usid:secret", (er, value) ->
		value
	)
	
exports.clear_session = (r) ->
	r.keys("usid:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing session: #{key}")
				r.del(key)			
	)


class exports.UserSession extends EventEmitter
	constructor: (@redis, @usid) ->
		if not @usid? 
			@generate_usid()
		@global_key = "usid:#{@usid}"
	
	generate_usid: () ->
		suid = connect.utils.uid(128)
		@usid = connect.utils.md5(suid)		
		console.log("suid generated #{@usid}")
		
	value: () ->
		@emit("new_usid", {usid: @usid})
	
	hit: (url) ->
		@redis.hset(@global_key, url, new Date())
		@redis.zincrby("usid:set:#{url}", 1, @global_key, (er, score) =>
			console.log("SCORE: usid:set:#{url} key #{@global_key} score: #{score}")
			if parseInt(score) == 1				
				@emit("session_start", {usid: @usid, url: url})
		)
		@emit("hit", {usid: @usid, url: url})

	leave: (url) ->
		@redis.zincrby("usid:set:#{url}", -1, @global_key, (er, score) =>
			console.log("SCORE: usid:set:#{url} key #{@global_key} score: #{score}")
			if parseInt(score) <= 0
				@emit("session_end", {usid: @usid, url: url})
				@redis.zrem("usid:set:#{url}", @global_key)				
		)		 
		@redis.hget(@global_key, url, (e, value) =>
			@redis.hset(@global_key, url, new Date() - value)
		)
		@emit("leave", {usid: @usid, url: url})
		
	