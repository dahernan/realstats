
EventEmitter = require('events').EventEmitter 
connect = require("connect")
crypto = require('crypto');


# exports.sha256 = (base, secret) ->
#	crypto.createHmac('sha256', secret).update(base).digest('base64').replace(/=*$/, '')


default_secret = "qhdyri37f"

exports.secret = (redis) ->
	redis.get("usid:secret", (er, value) ->
		value
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

		
		
	