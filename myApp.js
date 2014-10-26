#!/usr/bin/env node


/**
 * Enable debug
 */

process.env.DEBUG = 'myApp, protoo:ERROR:*, protoo:*'


/**
 * Dependencies.
 */

var protoo = require('./');
var http = require('http');
var https = require('https');
var url = require('url');
var fs = require('fs');
var debug = require('debug')('myApp');


debug('protoo version: %s', protoo.version);

debug('creating a "protoo" application');
var app = protoo();  // My Protoo application.

debug('creating a HTTP server on port 10080');
var httpServer = http.createServer();
httpServer.listen(10080, '127.0.0.1');

debug('creating a HTTPS server on port 10443');
var httpsServer = https.createServer({
	cert: fs.readFileSync('./test/include/local.protoo.org.crt.pem'),
	key: fs.readFileSync('./test/include/local.protoo.org.key.pem')
});
httpsServer.listen(10443, '127.0.0.1');

debug('handle Protoo non-secure WebSocket access on the HTTP server');
app.handleWebSocket(httpServer);

debug('handle Protoo secure WebSocket access on the HTTPS server');
app.handleWebSocket(httpsServer);


app.on('error', function(error) {
	debug('on(error) | %s', error);
});


app.on('ws:connecting', function(info, acceptCb, rejectCb, waitCb) {
	var req = info.req;
	var origin = info.origin;
	var socket = info.socket;
	var u = url.parse(req.url, true);
	var username = u.query.username;
	var uuid = u.query.uuid;

	// console.log(u);

	debug('on(ws:connecting) | [method:%s | url:%s | origin:%s | src:%s:%s]',
		req.method, req.url, origin, socket.remoteAddress, socket.remotePort);

	var peerInfo = {
		username: username,
		uuid: uuid
	};

	var onPeerCb = function(peer) {
		debug('onPeerCb for peer %s', peer);
	};

	// setTimeout(function() {
		acceptCb(peerInfo, onPeerCb);
		// rejectCb(403, 'Y U NOT ALLOWED');
		// rejectCb();
	// }, 5000);

	// waitCb();
	// setTimeout(function() {
		// socket.end();
	// }, 2000);
});


app.on('peer:online', function(peer) {
	debug('on(peer:online) | [username:%s | uuid:%s]', peer.username, peer.uuid);
});


app.on('peer:offline', function(peer) {
	debug('on(peer:offline) | [username:%s | uuid:%s]', peer.username, peer.uuid);
});





// Run interactive Node REPL.

global.app = app;  // Make the app global.
var r = require('repl').start({
	prompt: '\n',
	useColors: true,
	useGlobal: true,
	ignoreUndefined: true
});
r.on('exit', function () {
	console.log();
	process.exit();
});

