
util = require("util")
redis = require("redis")
r = redis.createClient()

io = require('socket.io').listen(8082)

handleRedisError = (err) ->
	console.log("Error #{err}")

r.on("error", handleRedisError)


io.sockets.on('connection', (socket) ->
	sub = redis.createClient()
	sub.on("error", handleRedisError)
	url = null
	socket.on('start', (data) ->
		url = data.url	
		console.log("new client connected #{socket.id} #{data}")	  
		r.hget("counter:#{data.url}", "#{data.url}", (e, value) ->
			socket.emit("update" , {count: value})  
		)
		sub.subscribe("channel:counter:#{data.url}")
	)
  
	socket.on('disconnect', ->
		console.log("client disconnected #{socket.id}")
		sub.unsubscribe("channel:counter:#{url}")
	)
   
	sub.on('message', (channel, message) ->
		console.log("new redis msg #{channel} #{message}")
		if channel is "channel:counter:#{url}"
			socket.emit("update", {channel: channel, count: message})	  
	)

)







