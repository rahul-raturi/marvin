// This loads the environment variables from the .env file
require('dotenv-extended').load();
var railway = require('./util/railwayHelper');
var news = require('./util/newsHelper');
var wiki = require('./util/wikiHelper');
var pricecomp = require('./util/priceCompHelper');
var spellService = require('./util/spell-service');
var util = require('./util/util');

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

bot.dialog('GetNews', function (session, args) {
  	news.newsHelper(session, args);
}).triggerAction({
	matches: 'GetNews'
});

bot.dialog('Wiki', function (session, args) {
	console.log('triggered');
	wiki.wikiHelper(session, args);
}).triggerAction({
	matches: 'Wiki'
});

bot.dialog('PriceCompare', function(session, args) {
	pricecomp.priceCompHelper(session, args);
}).triggerAction({
	matches: 'PriceCompare'
});

bot.dialog('chooseProd', [
    function(session) {
        builder.Prompts.choice(session,
            'Which option are you looking for?',
            session.userData.products,
            { listStyle: builder.ListStyle.button });
    },
	function(session,result){
		session.userData.selectedProd = result.response.entity;
		session.userData.itemindex = result.response.index;
		pricecomp.selectedProdCompare(session);
	}
]);

bot.dialog('help', function(session, args) {
	var helpPrompt = [
		"Need help? Try anything similar to these queries:",
		"Sure. You can try anything similar to following queries:",
		"As of now, I'm capable to answer anything similiar to these queries:"
	];
	var sampleQueries = [
		"Tell me about Sydney",
		"Google top news",
		"Show me the status of PNR 2663924321",
		"Compare prices for iphone 7 in mobile phones",
		"Price comparison in popup toasters for bajaj atx03 600",
		"Latest news from techcrunch",
		"Who was Sir Don Bradman",
		"Get popular news from the hindu",
		"News",
		"Compare prices in mobile phones for samsung galaxy core",
		"Price comparison for eureka forbes in water purifiers",
		"Compare prices for Blackberry Priv in mobile phones",
		"Popular news"
		/* Add more sample queries here */
	];
	var rnd1 = Math.floor(Math.random()*helpPrompt.length)
	var random_help_msg = helpPrompt[rnd1];
	var message = random_help_msg + "<br>" + sampleQueries.join("<br>");
	util.messageUser(session, message); 
}).triggerAction({
	matches: 'Help'
});

bot.dialog('Hello', function(session, args) {
	var intromsg = "Hi there!<br>I'm MARVIN, a Multipurpose Informative Chatbot.<br>You want to:<br>Check your\
	PNR status?<br>Know what's happening around the world?<br>Get information about anything that exists\
	in this world?<br>Compare Prices for products available on different online stores?<br>I'm here to help you\
	 out.<br>You can ask me for help anytime if you need assistance.<br>";
	util.messageUser(session, intromsg);
}).triggerAction({
	matches: 'Hello'
});