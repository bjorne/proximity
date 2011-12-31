var util = require('util'),
    http = require('http'),
    url = require('url');

var Proximity = function(options) {
  var _rules = [];

  var findRules = function(conditions) {
    var returnRules = [];
    for (var i = 0; i < _rules.length; i++) {
      var rule = _rules[i];
      for (var j in conditions) {
        if (conditions.hasOwnProperty(j) && rule.hasOwnProperty(j) && conditions[j] === rule[j]) {
          returnRules.push(rule);
        }
      }
    }
    return returnRules;
  };

  var applyModifier = function(modifier, value) {
    if (typeof modifier === 'function') {
      value = modifier(value);  
    } else {
      value = modifier;
    }
    return value;
  }

  var applyRuleModifiers = function(modifiers, values) {
    for (var mod in modifiers) {
      if (!values[mod]) {
        throw new Error('Rule modifier not found: ' + mod);
      }
      applyModifier(modifiers[mod], values[mod]);
    }
    return values;
  };

  var applyRulesOfType = function(type, url, obj) {
    var numMatches = 0;
    var bodyModifiers = [];
    var buffer = false;

    findRules({ type: type }).every(function(rule) {
      var match = url.match(rule.match.url);
      if (match) {
        if (rule.url) {
          var before = obj.url;
          obj.url = applyModifier(rule.url, obj.url);
          console.log("URL:", before, " -> ", obj.url);
        }

        if (typeof rule.headers === 'function') {
          obj.headers = rule.headers(obj.headers);
        } else if (typeof rule.headers === 'object') {
          obj.headers = applyRuleModifiers(rule.headers, obj.headers);
        }

        if (rule.body) {
          buffer = true;
          bodyModifiers.push(rule.body);
          // Mark obj for buffering and queue modifier
          // obj.body = applyModifier(rule.body, obj.body);
        }

        numMatches += 1;

        return !rule.last;
      }
    });

    console.log(type + " rules matched: " + numMatches, ", buffer:", buffer);

    return {
      obj: obj,
      buffer: bodyModifiers.length > 0,
      bodyModifiers: bodyModifiers
    }
  };

  var createServer = function() {
    http.createServer(function (req, res, next) {
      // Apply request modifier rules
      var reqStatus = applyRulesOfType('request', req.url, req);

      var curl = url.parse(reqStatus.obj.url);
      var poptions = {
        host: curl.hostname,
        port: curl.port,
        path: curl.pathname + (curl.query ? '?' + curl.query : ''),
        method: reqStatus.obj.method
      };
      
      var preq = http.request(poptions);
      preq.on('response', function(pres) {
        var presStatus = applyRulesOfType('response', req.url, pres);
        var bufferedPresData = '';
        res.writeHead(pres.statusCode, pres.headers);
        pres.on('data', function(chunk) {
          if (presStatus.buffer) {
            bufferedPresData += chunk;
          } else {
            res.write(chunk);
          }
        });
        pres.on('end', function() {
          if (presStatus.buffer) {
            presStatus.bodyModifiers.forEach(function(mod) {
              bufferedPresData = applyModifier(mod, bufferedPresData);
            });
          }
          res.end(bufferedPresData);
        });
      });
      
      var bufferedData = '';
      req.on('data', function(chunk) {
        if (reqStatus.buffer) {
          bufferedData += chunk;
        } else {
          preq.write(chunk);
        }
        
      });
      req.on('end', function() {
        if (reqStatus.buffer) {
          reqStatus.bodyModifiers.forEach(function(mod) {
            bufferedData = applyModifier(mod, bufferedData);
          });
          // preq.write(bufferedData);
        }
        preq.end();
      });
      
    }).listen(options.port);
    util.puts('proximity' + ' server started on port ' + options.port.toString());
  };

  var setRules = function(rules) {
    _rules = rules;
  };

  return {
    createServer: createServer,
    setRules: setRules
  };
};

exports.createServer = function(options) {
  var prox = new Proximity(options);
  prox.createServer();
  return prox;
};
