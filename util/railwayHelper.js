var util = require('./util');
var request = require('request');

var pnrHelper = function(session, args) {
	if(args.intent.score > 0.99) {
		console.log(args);
		if(!args.intent.entities || args.intent.entities[0]['type'] != 'builtin.number' || args.intent.entities[0]['entity'].length != 10) {
			util.messageUser(session, "Please provide a valid PNR number.");
		}
		else {
			var pnr = args.intent.entities[0]['entity'];
			// Make the request using railway API
			pnrEnquiry(session, pnr, function(pnrStatus) {
				var msg = "Here's the status of PNR " + pnr + ", just for you:";
				for(i=0; i!=pnrStatus.passengers.length; i++) {
					msg += "<br>" + pnrStatus.passengers[i].booking_status;
				}
				util.messageUser(session, msg);
			});
		}
	}
}

function pnrEnquiry(session, pnr, cb) {
	var api_key = 'dcyde95j';
	var url = 'http://api.railwayapi.com/pnr_status/pnr/' + pnr + '/apikey/' + api_key;
	request(url, function(error, response, body) {
		if(error) {
			util.messageUser(session, 'Some network error');
		}
		if(response.statusCode !== 200) {
			util.messageUser(session, 'Retry');
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
			util.messageUser(session, 'Please retry the query');
		}
	});
}

module.exports.pnrHelper = pnrHelper;
