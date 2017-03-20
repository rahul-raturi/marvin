// This loads the environment variables from the .env file
require('dotenv-extended').load();

var builder = require('botbuilder');
var restify = require('restify');
var Store = require('./store');
var spellService = require('./spell-service');
var request = require('request');

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
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
	if(args.intent.score > 0.99) {
		if(!args.intent.entities || args.intent.entities[0]['type'] != 'builtin.number' || args.intent.entities[0]['entity'].length != 10) {
			messageUser(session, "Please provide a valid PNR number.");
		}
		else {
			var pnr = args.intent.entities[0]['entity'];
			// Make the request using railway API
			pnrEnquiry(session, pnr, function(pnrStatus) {
				var msg = "Here's the status of PNR " + pnr + ", just for you:";
				for(i=0; i!=pnrStatus.passengers.length; i++) {
					msg += "<br>" + pnrStatus.passengers[i].booking_status;
				}
				messageUser(session, msg);
			});
		}
	}
}).triggerAction({
	matches: 'PNRStatus'
});

function messageUser(session, msg) {
	session.send(msg);
}

function pnrEnquiry(session, pnr, cb) {
	var api_key = 'dcyde95j';
	var url = 'http://api.railwayapi.com/pnr_status/pnr/' + pnr + '/apikey/' + api_key;
	console.log(url);
	request(url, function(error, response, body) {
		if(error) {
			messageUser(session, 'Some network error');
		}
		if(response.statusCode !== 200) {
			messageUser(session, 'Retry');
		}
		// Match with railway api response codes
		var pnrStatus = JSON.parse(body);
		if(pnrStatus.response_code === 403) {
			console.log('Railway api daily quota exhausted');
		}
		else if(pnrStatus.response_code === 200) {
			cb(pnrStatus);
		}
		else {
			messageUser(session, 'Please retry the query');
		}
	});
}
