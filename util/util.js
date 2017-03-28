var messageUser = function(session, msg) {
	session.send(msg);
}

var networkError = function(session) {
	session.send("Some network error has occurred. Please check your connection");
}

module.exports.messageUser = messageUser;
module.exports.networkError = networkError;
