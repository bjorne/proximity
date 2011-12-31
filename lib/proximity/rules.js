var unwantedHeaders = ['if-modified-since'];

var removeCachingHeaders = function(headers) {
  for (var header in headers) {
    if (unwantedHeaders.indexOf(header) != -1) {
      delete headers[header];
    }
  }
};

var rewriteRules = [
  {
    match: /gp\.se\/.+burt.+gp_[0-9]+.js/,
    target: {
      host: 'localhost',
      port: 3000,
      path: 'rfm/gp/rich-gp.js'
    }
  }
];
