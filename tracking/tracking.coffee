
util = require("util")
redis = require("redis")
trackutils = require("../trackutils/trackutils.js")
session = require("./session/session.js")
connect = require("connect")
sio = require('socket.io')
counters = require('../counters/counters.js')
r = redis.createClient()

r.on("error", (err) ->
	console.log("Error #{err}")
)


store_handshake = (r, socket) ->
	hit = "hit:#{socket.id}"
	r.hset(hit, "time", socket.handshake.time)
	r.hset(hit, "address", socket.handshake.address.address)
	r.hset(hit, "referer", socket.handshake.referer)
	r.hset(hit, "user-agent", socket.handshake.headers["user-agent"])
	r.hset(hit, "accept-language", socket.handshake.headers["accept-language"])
	r.hset(hit, "cookie", socket.handshake.headers["cookie"])
	r.hset(hit, "handshake_host", socket.handshake.headers["host"])


counters.clear_counters(r)

server = connect(connect.static(__dirname + '/public'), (req, resp) ->	
) 

server.listen(8080)
io = sio.listen(server)

io.sockets.on('connection', (socket) ->
	console.log("new client with id " + util.inspect(socket.handshake, true, null))
	store_handshake(r,socket)
	suid = trackutils.getCookie("_usid",socket.handshake.headers["cookie"])
	console.log("new user with id #{suid}")
	usession = new session.UserSession(r, suid)
	
	usession.on("new_usid", (data) ->
			console.log("EVENT new_usid #{data.usid}")
			socket.emit("new_usid", {usid: data.usid})
	)
	
	usession.value()
			    
	socket.on('new_client', (data) -> 
		uri = trackutils.parseUri(data.url)
		console.log("navigator data: #{data.url} referrer #{data.referrer}")
		r.hset("hit:#{socket.id}", "host", uri.host)
		r.hset("hit:#{socket.id}", "path", uri.path)		
		views_live = new counters.Counter(r, "views_live",uri.host)
		views_live.pincr(1)
		pviews_live = new counters.Counter(r, "pviews_live",uri.host, uri.path)
		pviews_live.incr(1)
		
		
		    
	)

	socket.on('disconnect', -> 
		console.log("user disconnected buuuuuu #{socket.id}")
		hit = "hit:#{socket.id}"						
		r.hget(hit, "host", (err, host) ->
			views_live = new counters.Counter(r, "views_live", host)
			views_live.pincr(-1)
			r.hget(hit, "path", (e, path) ->
				console.log("=======   #{host}#{path}")
				pviews_live = new counters.Counter(r, "pviews_live",host, path)
				pviews_live.incr(-1)
				r.del(hit)
			)	
		)
	)
	
	
)


