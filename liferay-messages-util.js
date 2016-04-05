'use strict'

var http = require('http');

var options = {
  hostname: 'localhost',
  port: 8080,
  auth: 'test@liferay.com:test',
  path: '/api/jsonws/mbmessage',
  method: 'POST',
};

var groupId = 20232;
var className = "net.indaba.lostandfound.model.Item";

exports.add = function (message, onSuccess, onFailure) {
	/* Categories not implemented yet
	**
	var messageCategories = '' + message.categories[0];
	for (var i = 0; i < message.categories.length; i++)
	messageCategories += ', ' + message.categories[i];
	*/
	var jsonrpc = {
		"method":"add-discussion-message",
		"params": {
			"groupId": groupId,
			"className": className,
			"classPK": message.itemId,
			"threadId":,
			"parentMessageId":,
			"subject": message.subject,
			"body": message.body,
		},
		"jsonrpc":"2.0"
	};
	
	var req = http.request(options, onSuccess);
	req.on('error', onFailure);
	req.write(JSON.stringify(jsonrpc));
	req.end();
};

exports.delete = function (messageId, onSuccess, onFailure) {
		var jsonrpc = {
				"method":"delete-message",
				"params": {
						"messageId": messageId,
				},
				"jsonrpc":"2.0"
		};
		var req = http.request(options, onSuccess, onFailure);
		req.on('error', onFailure);
		req.write(JSON.stringify(jsonrpc));
		req.end();
}
