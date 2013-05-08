var http = require('http'),
    net = require('net');
var util = require('util');
var proximity = require('../lib/proximity');

var proxyPort = 23473;
var serverPort = 56382;

describe('Proximity', function() {
  beforeEach(function(done) {
    // this.server = net.createServer(function(conn) {
    //   conn.on('data', function() {
    //     conn.write('HTTP/1.1 200 OK\n\nbar');
    //   });
    // });
    this.server = http.createServer(function(req, res) {
      res.sendDate = false;
      res.writeHead(200, { foo: 'bar', 'content-length': 3 });
      // res.sendDate = false;
      res.end('baz', 'utf8');
    });
    this.server.listen(serverPort);
    this.proxy = proximity.createServer();
    this.proxy.listen(proxyPort);

    this.makeRequest = function(callback, done) {
      var conn = net.connect(proxyPort, function() {
        conn.setEncoding('binary');
        conn.on('data', function(chunk) {
          conn.end();
          callback(chunk);
          done();
        }.bind(this));
        conn.write('GET http://localhost:' + serverPort + '/ HTTP/1.1\n\n');
      }.bind(this));
    };
    done();
  });

  afterEach(function(done) {
    this.server.on('close', function() {
      this.proxy.on('close', done);
      this.proxy.close();
    }.bind(this));
    this.server.close();
  });

  it('proxies a request', function(done) {
    this.makeRequest(function(chunk) {
      chunk.toString().should.equal('HTTP/1.1 200 OK\r\nfoo: bar\r\ncontent-length: 3\r\nconnection: keep-alive\r\n\r\nbaz');
    }, done);
  });

  it('replaces bar with qux in body', function(done) {
    this.proxy.use(function(req, next) {
      req.proxy(function(res, next) {
        res.body = res.body.replace('baz', 'qux');
        next();
      });
      next();
    });

    this.makeRequest(function(chunk) {
      chunk.toString().should.equal('HTTP/1.1 200 OK\r\nfoo: bar\r\ncontent-length: 3\r\nconnection: keep-alive\r\n\r\nqux');
    }, done);
  });

  // it('sets header key', function(done) {
  //   var proxy = proximity.createServer();
  //   proxy.middleware(function() {
  //     this.setHeader('foo', 'bar');
  //   });
  //   proxy.listen(proxyPort);
  // });  

  // it('forwards a request to multiple targets', function(done) {
  //   var proxy = proximity.createServer();
  //   proxy.middleware(function() {
  //   });
  //   proxy.listen(proxyPort);
  // });  
});
