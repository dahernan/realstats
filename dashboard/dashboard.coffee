
util = require("util")
redis = require("redis")
counters = require('../counters/counters.js')

r = redis.createClient()

io = require('socket.io').listen(8082)

handleRedisError = (err) ->
	console.log("Error #{err}")

r.on("error", handleRedisError)


io.sockets.on('connection', (socket) ->
	# TODO: decide if reuse the same conection or create new for each
	sub = redis.createClient()
	sub.on("error", handleRedisError)
	
	views_live = null
	users_live = null
	socket.on('start', (data) ->
		console.log("new client connected #{socket.id} #{data}")
		url = data.url # TODO get from store 
		views_live = new counters.Counter(r,"views_live", url)
		users_live = new counters.Counter(r,"users_live", url)
		views_live.subscribe(sub)
		users_live.subscribe(sub)
		views_live.on("counter_change", (change) ->
			console.log("counter_change!   #{change.global_key}  #{change.counter_key} #{change.count}")
			socket.emit("update", {count: change.count})
		)
		users_live.on("counter_change", (change) ->
			console.log("counter_change!   #{change.global_key}  #{change.counter_key} #{change.count}")
			socket.emit("update", {count: change.count})
		)
		views_live.count()
		users_live.count()
		
	)
  
	socket.on('disconnect', ->
		console.log("client disconnected #{socket.id}")
		views_live.unsubscribe()
		users_live.unsubscribe()
		sub.quit()
	)
	
	
   
	

)







