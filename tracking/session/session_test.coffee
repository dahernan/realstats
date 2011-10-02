vows = require('vows')
util = require("util")
assert = require('assert')
redis = require("redis")
session = require("./session.js")
r = redis.createClient()
sub = redis.createClient()
i = 0

vows.describe("Session Test").addBatch(
	'Testing user session generation and hits':
		topic: () -> 
			new session.UserSession(r)
		'is an object': (sid) ->
			assert.instanceOf(sid, session.UserSession)
		'when value is invoked':
			topic: (sid) ->				
				sid.on("new_usid", @callback)
				sid.value()
				return
			'should emit the event new_usid with the user id as a data': (data, err) ->
				console.log(util.inspect(err)) if err
				assert.isTrue(data.usid.length > 0)
		'hit an url':
			topic: (sid) ->
				sid.on("session_start", @callback)					
				sid.hit("www.dahernantest.net")
				return
			'should emit start a session event': (data, err) ->
				console.log(util.inspect(err)) if err
				console.log(data.url)
				assert.equal("www.dahernantest.net", data.url)
				assert.isTrue(data.usid.length > 0)				
		'leave an url':
				topic: (sid) ->
					console.log("yeeeeeeeeeeeeeeeeep")						
					sid.on("session_end", @callback)
					sid.leave("www.dahernantest.net")
					return
				'should emit end session for that url event': (data, err) ->
					console.log(util.inspect(err)) if err
					assert.equal("www.dahernantest.net", data.url)
					assert.isTrue(data.usid.length > 0)			
					
												
).run()