var util = require('util'),
    colors = require('colors'),
    http = require('http'),
    url = require('url'),
    httpProxy = require('http-proxy');

exports.createServer = function(port) {
  http.createServer(function (req, res, next) {
    var curl = url.parse(req.url);
    var poptions = {
      host: curl.hostname,
      port: curl.port,
      path: curl.pathname + curl.query ? '?' + curl.query : '',
      method: req.method
    };
    
    var preq = http.request(poptions);
    preq.on('response', function(pres) {
      res.writeHead(pres.statusCode, pres.headers);
      pres.on('data', function(chunk) {
        res.write(chunk);
      });
      pres.on('end', function() {
        res.end();
      });
    });
    req.on('data', function(chunk) {
      preq.write(chunk);
    });
    req.on('end', function() {
      preq.end();
    });
    
  }).listen(port);
  util.puts('proximity'.yellow + ' server started on port ' + port.toString().yellow);
};
