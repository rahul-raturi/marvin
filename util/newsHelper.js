var request = require('request');
var util = require('./util');
var builder = require('botbuilder');
var newsdict = require('./newsDict');

var newssource_lookup = newsdict.slug_lookup;

var newsHelper = function(session, args) {
  if(args.intent.score > 0.95){
      // get news type i.e. top/popular/latest
      var newstype = getNewsType(session, args);
      //get news Source
      var newssource = getNewsSource(session, args);
      console.log(newstype);
      console.log(newssource);
          getNews(session, function(topNews){
              var newsCards = getallnewscards(session, topNews);
              // create reply with Carousel AttachmentLayout
              var reply = new builder.Message(session)
                  .attachmentLayout(builder.AttachmentLayout.carousel)
                  .attachments(newsCards);

              session.send(reply);
          });

  }else{
    util.messageUser(session,"Type \'help\' if you need assistance.");
  }
}

function getNewsType(session, args){
    //setting default newstype to be top
    var newstype = "top";
    var entities = args.intent.entities;
    console.log(entities);
    for (entityinfo in entities){
        if(entities[entityinfo]['type'] == 'newstype'){
                newstype = entities[entityinfo]['entity'];
                break;
        }
    }
    return newstype;
}

function getNewsSource(session, args){
    var newssource = "";
    var entities = args.intent.entities;
    for (entityinfo in entities){
        if(entities[entityinfo]['type'] == 'news_source'){
                newssource = entities[entityinfo]['entity'];
                break;
        }
    }
    // random news source selection if no news source detected
    if(newssource == "")
        newssource = fetch_random(newssource_lookup);
    else    // news source slug lookup from news source name
        newssource = newssource_lookup[newssource];
    return newssource;
}

// function to fetch random key from a dictionary
function fetch_random(obj) {
    var temp_key, keys = [];
    for(temp_key in obj) {
       if(obj.hasOwnProperty(temp_key)) {
           keys.push(temp_key);
       }
    }
    return obj[keys[Math.floor(Math.random() * keys.length)]];
}

function getNews(session, cb) {
	var news_api_key = '365758ccf07b492384e1ff1b50316168';
  //Presently fetching only top news from "Tech Crunch"
  //Have to do it for around 70 news sources which would serve news to users with queries like
  // Fetch me the top/latest news from times of india/bbc news/cnbc etc.
	var url = ' https://newsapi.org/v1/articles?source=techcrunch&sortBy=top&apiKey=' + news_api_key;
	console.log(url);
	request(url, function(error, response, body) {
		if(error) {
			util.networkError(session);
		}
		if(response.statusCode !== 200) {
			util.messageUser(session, 'Retry');
		}
		var topnews = JSON.parse(body);
		if(topnews.status !== "ok") {
			util.messageUser(session, "Try Again!!");
		}
		else {
			cb(topnews);
		}
	});
}

function getallnewscards(session, TopNews){
  var newscards = [];
  for(i=0; i!=TopNews.articles.length; i++){
      newscards[i] = new builder.HeroCard(session)
            .title(TopNews.articles[i].title)
            .text(TopNews.articles[i].description)
            .images([
                builder.CardImage.create(session, TopNews.articles[i].urlToImage)
            ])
            .buttons([
                builder.CardAction.openUrl(session, TopNews.articles[i].url, 'Read Complete')
            ]);
  }
  return newscards;
}

module.exports.newsHelper = newsHelper;
