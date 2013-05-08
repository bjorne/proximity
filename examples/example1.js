var proximity = require('../lib/proximity');

var proxy = proximity.createServer().listen(8484);

proxy.use(function(req, next) {
  if (req.url == 'http://www.aftonbladet.se/') {
    req.proxy(function(res, next) {
      res.body = res.body.replace(/( \w+ )/ig, ' LOL ');
      next();
    });
  }
  next();
});
