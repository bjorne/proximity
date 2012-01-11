var proximity   = require('../../proximity'),
    proximityUi = require('../../proximity-ui'),
    connect     = require('connect');

var proxy = proximity.proxy();
var server = connect.createServer(
  connect.logger(),
  proxy.middleware()
).listen(8004);

var uiServer = proximityUi.createServer({
  proxy: proxy
}).listen(4000);

proxy.setRules([
  proximity.rules.noCompression,
  proximity.rules.noCache,
  {
    // paragraph count
    // e.g.
    // <p>hello world</p> => <p>hello world (11)</p>
    name: 'Wikipedia paragraph count',
    type: 'response',
    match: { url: /wikipedia.org/ },
    body: function(body) {
      return body.replace(/(<p>)(.+)(<\/p>)/gm, function(s,pre,str,post) { return pre + str + ' (' + str.length + ')' + post; });
    }
  }
]);

