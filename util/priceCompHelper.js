var request = require('request');
var util = require('./util');
var builder = require('botbuilder');
var path = require('path');

var priceCompHelper = function(session, args){
    if(args.intent.score > 0.98){
        // get product category and product name
        var prodinfo = getproductcategoryandname(session, args);
        var prod_search = slug_conversion(prodinfo[0],"+");
        var prod_category = prodinfo[1];
        console.log(prod_search);
        console.log(prod_category);
        
        if(prod_search == "")
            util.messageUser(session,"Mention the name of product whose price you want to compare.");
        else if(prod_category == "")
            util.messageUser(session,"Mention the category of the product or Type \'help\' if you need assistance.");
            else{
                comparePrice(session, prod_search, prod_category, function(priceinfo){
                    var products = [],prod_num = priceinfo.product.length;
                    for (item in priceinfo.product){
                        products.push(priceinfo.product[item].model);
                    }
                    session.userData.products = products;
                    session.userData.prod_category = prod_category;
                    session.userData.priceinfo = priceinfo;
                    if(prod_num > 1)
                        util.messageUser(session, prod_num + ' Products Found!');
                    if(prod_num > 15)
                        util.messageUser(session,"Too many Products. Can't display them all.");
                    else if(prod_num >= 2)
                        return session.beginDialog('chooseProd');
                        else if(prod_num == 1){
                                session.userData.itemindex = 0;
                                session.userData.selectedProd = priceinfo.product[0].model;
                                console.log(priceinfo);
                                selectedProdCompare(session);
                            }
                            else
                            util.messageUser(session, "No such Product exists.");
                });
            }
    }
    else{
        util.messageUser(session,"Type \'help\' if you need assistance.");
    }

}

var getproductcategoryandname = function(session, args){
    var prodname = "", prodcategory = "";
    var entities = args.intent.entities;
    for (entitynum in entities){
        if(entities[entitynum]['type'] == 'prod_category')
            prodcategory = slug_conversion(entities[entitynum]['entity'],"_");
        else if(entities[entitynum]['type'].includes("builtin.encyclopedia") || 
            entities[entitynum]['type'] == 'prod_search')
            prodname = entities[entitynum]['entity'];
    }
    return [prodname, prodcategory];
}

var slug_conversion = function(prod_category, replacement){
    return prod_category.replace(/ /g, replacement);
}

var comparePrice = function(session, searchToken, category, cb){
    var pricecomp_key = 'INHBCDHTXRWPTSXY';
    var pricecomp_user = 'parag009';
    var base_url = 'http://api.pricecheckindia.com/feed/product/'+ category
                 +'/'+ searchToken +'.json?user='+ pricecomp_user +'&key='+pricecomp_key;
    request(base_url, function(error, response, body) {
        if(error) {
			util.networkError(session);
		}
        if(response.statusCode !== 200){
            util.messageUser(session, 'Retry');
        }
        var pricecompinfo = JSON.parse(body);
        cb(pricecompinfo);
    });
}

var selectedProdCompare = function(session){
    var stores = session.userData.priceinfo.product[session.userData.itemindex].stores;
    if(stores.length != 0){
        var shopCards = getallshopcards(session, stores);
        // create reply with Carousel AttachmentLayout
        var reply = new builder.Message(session)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(shopCards);

        session.send(reply);   
    }
    else{
        util.messageUser(session, "Product out of stock!");
    }
}

var getallshopcards = function(session, stores){
    var shopcards = [];
    for(i=0; i!=stores.length; i++){
        var product = session.userData.selectedProd;
        var imgUrl = path.join(__dirname, '../images/');
        imgUrl += stores[i].website + '.png';
        var price = 'PRICE -> Rs. '+ stores[i].price;  
        //var stock = 'STOCK -> '+stores[i].stock;
      shopcards[i] = new builder.ThumbnailCard(session)
            .title(stores[i].website.toUpperCase()+ ' - '+product.toUpperCase())
            //.subtitle(stock)
            .text(price)
            .images([
                builder.CardImage.create(session, imgUrl)
            ])
            .buttons([
                builder.CardAction.openUrl(session, stores[i].url, 'BUY')
            ]);
    }
    return shopcards;
}


module.exports.priceCompHelper = priceCompHelper;
module.exports.selectedProdCompare = selectedProdCompare;