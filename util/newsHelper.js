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
          getNews(session, newstype, newssource, function(News){
              var newsCards = getallnewscards(session, News);
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

function getNews(session, news_type, news_source, cb) {
	var news_api_key = '365758ccf07b492384e1ff1b50316168';
	var url = 'https://newsapi.org/v1/articles?source=' + news_source + '&sortBy=' + news_type + '&apiKey=' + news_api_key;
	request(url, function(error, response, body) {
		if(error) {
			util.networkError(session);
		}
		var news = JSON.parse(body);
		if(news.status == "error") {
			url = 'https://newsapi.org/v1/articles?source=' + news_source + '&sortBy=top&apiKey=' + news_api_key;
            request(url, function(error, response, body){
                if(error) {
                    util.networkError(session);
                }
                if(response.statusCode !== 200){
                    util.messageUser(session, 'Retry');
                }
                var news = JSON.parse(body);
                if(news.status !== "ok"){
                    util.messageUser(session, "Try Again after some time.");
                }
                else{
                    cb(news);
                }
            });
        }
		else {
			cb(news);
		}
	});
}

function getallnewscards(session, News){
  var newscards = [];
  for(i=0; i!=News.articles.length; i++){
      newscards[i] = new builder.HeroCard(session)
            .title(News.articles[i].title)
            .text(News.articles[i].description)
            .images([
                builder.CardImage.create(session, News.articles[i].urlToImage)
            ])
            .buttons([
                builder.CardAction.openUrl(session, News.articles[i].url, 'Read Complete')
            ]);
  }
  return newscards;
}

module.exports.newsHelper = newsHelper;
