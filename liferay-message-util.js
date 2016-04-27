'use strict'

var http = require('http');
var liferay = require('./liferay.json')

var options = {
  hostname: liferay.hostname,
	port: liferay.port,
	auth: liferay.auth,
  path: '/api/jsonws/mbmessage',
  method: 'POST',
};

var groupId = liferay.groupId;
var className = "net.indaba.lostandfound.model.Item";

exports.add = function (message, onSuccess, onFailure) {
	var jsonrpc = {
		"method":"add-discussion-message",
		"params": {
			"groupId": message.office,
			"className": className,
			"classPK": message.itemId,
			"threadId": 0,
			"parentMessageId": 0,
			"subject": message.subject,
			"body": message.body,
		},
		"jsonrpc":"2.0"
	};
	console.log(jsonrpc.params);

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

exports.update = function (message, onSuccess, onFailure) {
	var jsonrpc = {
		"method":"update-discussion-message",
		"params": {
			"className": className,
			"classPK": message.itemId,
			"messageId": message.id,
			"subject": message.subject,
			"body": message.body,
		},
		"jsonrpc":"2.0"
	};
	var req = http.request(options, onSuccess, onFailure);
	req.on('error', onFailure);
	req.write(JSON.stringify(jsonrpc));
	req.end();
}

