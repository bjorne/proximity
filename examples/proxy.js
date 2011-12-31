var proximity = require('proximity');

var prox = proximity.createServer({ port: 8004 });

// DSL 1

prox.setRules([
  // {
  //   type: 'request',
  //   match: { url: 'localhost' },
  //   url: 'http://localhost:3000/',
  //   body: 'hej'
  // },
  {
    type: 'response',
    match: { url: 'localhost' },
    body: function(body) {
      return body.replace(/>agent</g, '>SKOJARE<');
    }
  }
]);

