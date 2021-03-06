util = require("util")
redis = require("redis")
counters = require('../counters/counters.js')
express = require('express')
sio = require('socket.io')

r = redis.createClient()

app = module.exports = express.createServer()

app.configure(() ->
	app.set('views', __dirname + '/views')
	app.set('view engine', 'jade')
	app.use(express.bodyParser())
	app.use(express.methodOverride())
	app.use(app.router)
	app.use(express.static(__dirname + '/public'))
)

app.configure('development', () ->
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })) 
)

app.configure('production', () ->
	app.use(express.errorHandler()) 
)


app.get('/', (req, res) ->
	res.render('index', {title: 'Express'})
)

app.listen(8082);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);



handleRedisError = (err) ->
	console.log("Error #{err}")

r.on("error", handleRedisError)

io = sio.listen(app)

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
		
		counter_change = (change) =>
			console.log("counter_change!   #{change.global_key}  #{change.counter_key} #{change.count}")
			socket.emit("update", {counter: change.counter_key, count: change.count})
						
		views_live.on("counter_change", counter_change)
		users_live.on("counter_change", counter_change)
		views_live.count()
		users_live.count()
		
	)
  
	socket.on('disconnect', ->
		console.log("client disconnected #{socket.id}")
		views_live.unsubscribe() if views_live?
		users_live.unsubscribe() if users_live?
		sub.quit()
	)
	
)

