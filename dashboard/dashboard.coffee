
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
	
	counter = null
	socket.on('start', (data) ->
		console.log("new client connected #{socket.id} #{data}")
		url = data.url # TODO get from store 
		counter = new counters.Counter(r, url)
		counter.subscribe(sub)		
		counter.on("counter_change", (count) ->
			console.log("counter_change!!!!! #{count}")
			socket.emit("update", {count: count})
		)
		counter.count()
		
	)
  
	socket.on('disconnect', ->
		console.log("client disconnected #{socket.id}")
		counter.unsubscribe()
		sub.quit()
	)
	
	
   
	

)







