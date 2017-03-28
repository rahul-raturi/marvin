// This loads the environment variables from the .env file
require('dotenv-extended').load();
var railway = require('./util/railwayHelper');
var news = require('./util/newsHelper');
var wiki = require('./util/wikiHelper');
var spellService = require('./util/spell-service');

var builder = require('botbuilder');
var restify = require('restify');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});
// Create connector and listen for messages
var connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector, function (session) {
    session.send('Sorry, I did not understand \'%s\'. Type \'help\' if you need assistance.', session.message.text);
});

// You can provide your own model by specifing the 'LUIS_MODEL_URL' environment variable
// This Url can be obtained by uploading or creating your model from the LUIS portal: https://www.luis.ai/
var recognizer = new builder.LuisRecognizer(process.env.LUIS_MODEL_URL);
bot.recognizer(recognizer);

bot.dialog('PNRStatus', function (session, args) {
	railway.pnrHelper(session, args);
}).triggerAction({
	matches: 'PNRStatus'
});

bot.dialog('TopNews', function (session, args) {
  news.newsHelper(session, args);
}).triggerAction({
	matches: 'TopNews'
});

bot.dialog('Wiki', function (session, args) {
	console.log('triggered');
	wiki.wikiHelper(session, args);
}).triggerAction({
	matches: 'Wiki'
});
