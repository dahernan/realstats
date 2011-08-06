
util = require("util")
redis = require("redis")
trackutils = require("../trackutils/trackutils.js")
io = require('socket.io').listen(8080)

r = redis.createClient()

r.on("error", (err) ->
	console.log("Error #{err}")
)


clear_counters = (r) ->
	r.keys("counter:*", (err, keys) ->
		for key in keys
			do (key) ->
				console.log("Clearing counter: #{key}")
				r.del(key)			
	)
	
increment_pcounter = (r, url, incr ) ->
	r.hincrby("counter:#{url}", url, incr, (e, counter_value) ->
		r.publish("channel:counter:#{url}" , counter_value)
	)

store_handshake = (r, socket) ->
	r.hset(socket.id, "time", socket.handshake.time)
	r.hset(socket.id, "address", socket.handshake.address.address)
	r.hset(socket.id, "referer", socket.handshake.referer)
	r.hset(socket.id, "user-agent", socket.handshake.headers["user-agent"])
	r.hset(socket.id, "accept-language", socket.handshake.headers["accept-language"])
	r.hset(socket.id, "cookie", socket.handshake.headers["cookie"])
	r.hset(socket.id, "handshake_host", socket.handshake.headers["host"])


clear_counters(r)

io.sockets.on('connection', (socket) ->
	console.log("new client with id " + util.inspect(socket.handshake, true, null))
	store_handshake(r,socket)
    
	socket.on('new_client', (data) -> 
		console.log("navigator data: #{data.url}")
		uri = trackutils.parseUri(data.url)
		increment_pcounter(r, uri.host, 1)		
		r.hincrby("counter:" + uri.host, uri.host + uri.path, 1) if uri.path? and uri.path != "/"
		r.hset(socket.id, "host", uri.host)
		r.hset(socket.id, "path", uri.path)    
	)
	
	socket.on('destroy_client', (data) ->
		console.log(data)
	)

	socket.on('disconnect', ->
		console.log("user disconnected buuuuuuu #{socket.id}")
		r.hget(socket.id, "host", (err, host) ->
			console.log(host)
			increment_pcounter(r, host, -1)			
			r.hget(socket.id, "path", (err, path) ->
				r.hincrby("counter:#{host}", host + path, -1);	
			)		    
		)
	)
)


