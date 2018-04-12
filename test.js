const wsClient = require('pull-ws/client')
const wsServer = require('pull-ws/server')

let serverEnd = null
wsServer(function (stream) {
	serverEnd = stream
	runTest()
}).listen(5555)

let clientEnd = wsClient('ws://localhost:5555')


// more or less example from muxrpc readme
var MRPC = require('muxrpc')
var pull = require('pull-stream')

function runTest () {
	//we need a manifest of methods we wish to expose.
	var api = {
		//async is a normal async function
		hello: 'async',

		//source is a pull-stream (readable)
		stuff: 'source'

		//TODO: sink and duplex pull-streams
	}

	//pass the api into the constructor, and then pass the object you are wrapping
	//(if there is a local api)
	var client = MRPC(api, null) () //remoteApi, localApi
	var server = MRPC(null, api) ({
		hello: function (name, cb) {
			cb(null, 'hello, ' + name + '!')
		},
		stuff: function () {
			return pull.values([1, 2, 3, 4, 5])
		}
	})

	// pass in a cb for the stream end event
	var a = client.createStream(console.log.bind(console, 'stream is closed'))
	var b = server.createStream()
	// or subscribe to the 'closed' event
	// b.once('closed', console.log.bind(console, 'stream is closed'))

	// pull(a, b, a) //pipe together
	pull(a, clientEnd, a)
	pull(b, serverEnd, b)

	client.hello('world', function (err, value) {
		if(err) throw err
		console.log(value)
		// hello, world!
	})

	pull(client.stuff(), pull.drain(console.log))
	pull(client.stuff(), pull.drain(console.log))
	pull(client.stuff(), pull.drain(console.log))
	// 1
	// 2
	// 3
	// 4
	// 5
}