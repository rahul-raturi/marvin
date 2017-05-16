var util = require('./util');
var request = require('request');

var pnrHelper = function(session, args) {
	if(args.intent.score > 0.99) {
		console.log(args);
		console.log(args.intent.entities[0]['type']);
		if(args.intent.entities.length === 0 || args.intent.entities[0]['type'] != 'builtin.number' || args.intent.entities[0]['entity'].length !== 10) {
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
			util.networkError(session);
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
			util.messageUser(session, 'Please recheck the PNR and retry query');
		}
	});
}

module.exports.pnrHelper = pnrHelper;
