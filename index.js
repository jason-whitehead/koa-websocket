"use strict";

const WebSocketServer = require('ws').Server,
  debug = require('debug')('koa:websockets'),
  compose = require('koa-compose'),
  co = require('co');

function KoaWebSocketServer (app) {
  this.app = app;
  this.middleware = [];
}

KoaWebSocketServer.prototype.listen = function (server) {
  this.server = new WebSocketServer({
      server: server
  });
  this.server.on('connection', this.onConnection.bind(this));
};

KoaWebSocketServer.prototype.onConnection = function(socket) {
  socket.on('error', function (err) {
    debug('Error occurred:', err);
  });
  const fn = co.wrap(compose(this.middleware));
  socket.path = socket.upgradeReq.url;
  fn.bind(socket).call().catch(function(err) {
    debug(err);
  });
};

KoaWebSocketServer.prototype.use = function (fn) {
  this.middleware.push(fn);
  return this;
};

module.exports = function (app) {
  const oldListen = app.listen;
  app.listen = function () {
    debug('Attaching server...');
    app.server = oldListen.apply(app, arguments);
    app.ws.listen(app.server);
    return app.server;
  };
  app.ws = new KoaWebSocketServer(app);
  return app;
};
