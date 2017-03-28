var util = require('./util');
var request = require('request');

var wikiHelper = function(session, args) {
	if(args.intent.score > 0.99) {
		if(!args.intent.entities) {
			util.messageUser(session, "Please provide a title you're looking for.");
		}
		else {
			var search_query = args.intent.entities[0]['entity'];
			queryWikipedia(search_query, session, function(title, summary) {
				var msg = "Here's some details on " + title + "<br>" + summary;
				util.messageUser(session, msg);
			});
		}
	}
}

function queryWikipedia(search_query, session, cb) {
	var base_url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&list=search&srprop=&srsearch=';
	var url = base_url + encodeURIComponent(search_query);
	request(url, function(error, response, body) {
		if(error) {
			util.networkError(session);
		}
		else {
			var results = JSON.parse(body);
			var title = results.query.search[0].title;
			var search_url = 'https://en.wikipedia.org/w/api.php?format=json&action=query&prop=extracts&exintro=&explaintext=&titles=' + title;
			request(search_url, function(error, response, body) {
				if(error) {
					util.networkError(session);
				}
				else {
					var results = JSON.parse(body);
					var pageid;
					var summary;
					for(pageid in results.query.pages) {
						summary = results.query.pages[pageid].extract;
						break;
					}
					cb(title, summary);
				}
			});
		}
	});
}

module.exports.wikiHelper = wikiHelper;
