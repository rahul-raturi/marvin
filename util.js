var messageUser = function(session, msg) {
	session.send(msg);
}
module.exports.messageUser = messageUser;
