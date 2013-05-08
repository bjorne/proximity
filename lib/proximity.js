var http = require('http'),
    url = require('url'),
    events = require('events');
var EventEmitter = events.EventEmitter;

function ProximityRequest(req) {
  this.req = req;
  this.url = req.url;
  this.method = req.method;
  this._responseCallbacks = [];
}

ProximityRequest.prototype = {
  run: function(middlewares, done) {
    var i = 0;
    var next = function() {
      if (i < middlewares.length) {
        middlewares[i++].call(this, this, next);
      } else {
        done();
      }
    }.bind(this);
    next();
  },
  proxy: function(callback) {
    this._responseCallbacks.push(callback);
  },
  requestTarget: function() {
    var uris = url.parse(this.url);
    uris.method = this.method;
    uris.agent = false;
    return uris;
  },
  invokeResponseCallbacks: function(proximityRes, done) {
    var i = 0;
    var next = function() {
      if (i < this._responseCallbacks.length) {
        this._responseCallbacks[i++].call(proximityRes, proximityRes, next);
      } else {
        done();
      }
    }.bind(this);
    next();
  }
};

function ProximityResponse(res, body) {
  this._res = res;
  this.body = body;
  this.statusCode = res.statusCode;
  this.headers = res.headers;
}

ProximityResponse.prototype = {
};

module.exports = {
  createServer: function() {
    var middlewares = [];
    var server = http.createServer(function(req, res) {
      req.on('error', function() {
        console.log('req error', req.url);
      });
      req.on('end', function() {
        var proximityReq = new ProximityRequest(req);
        proximityReq.run(middlewares, function() {
          var proxyReq = http.request(proximityReq.requestTarget(), function(proxyRes) {
            if (proxyRes.headers['content-type'] && (proxyRes.headers['content-type'].match(/^text\//) || proxyRes.headers['content-type'].match(/javascript/))) {
              proxyRes.setEncoding('utf8');
              var body = '';
              proxyRes.on('data', function(chunk) {
                body += chunk.toString();
              });
              proxyRes.on('end', function() {
                res.sendDate = false;
                var proximityRes = new ProximityResponse(proxyRes, body);
                proximityReq.invokeResponseCallbacks(proximityRes, function() {
                  res.writeHead(proximityRes.statusCode, proximityRes.headers);
                  res.end(proximityRes.body);
                });
              });
            } else {
              proxyRes.pipe(res);
            }
          }.bind(this));
          proxyReq.on('error', function() {
            console.log('proxyReq error', req.url);
          });
          proxyReq.end();
        });
      }.bind(this));
    });

    server.use = function(mw) {
      middlewares.push(mw);
    };

    return server;
  }
};
