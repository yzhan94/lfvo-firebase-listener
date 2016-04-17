'use strict';

var http = require('http');
var liferay = require('./liferay.json')

var options = {
	hostname: liferay.hostname,
	port: liferay.port,
	auth: liferay.auth,
	path: '/api/jsonws/lfvo-portlet.item',
	method: 'POST',
};

exports.addOrUpdate = function (item, onSuccess, onFailure) {
	if (item.categories) {
		var categories = Object.keys(item.categories);
		var itemCategories = '' + categories[0];
		for (var i = 1; i < categories.length; i++) {
			itemCategories += ', ' + categories[i];
		}
	}	
	var jsonrpc = {
		"method":"add-or-update-item",
		"params": {
			"+item": "net.indaba.lostandfound.model.impl.ItemImpl",
			"item.itemId": item.id ? item.id : 0,
			"item.groupId": item.office,
			"item.name": item.name,
			"item.description": item.description,
			"item.type": item.type,
			"item.new": item.id ? false : true,
			"serviceContext.userId": liferay.userId,
			"serviceContext.companyId": liferay.companyId,
			"serviceContext.groupId": liferay.groupId,
			"serviceContext.assetCategoryIds": itemCategories
		},
		"jsonrpc":"2.0"
	};

	var req = http.request(options, onSuccess);
	req.on('error', onFailure);
	req.write(JSON.stringify(jsonrpc));
	req.end();
};

exports.delete = function (itemId, onSuccess, onFailure) {
	var jsonrpc = {
		"method":"delete-item",
		"params": {
			"itemId": itemId,
		},
		"jsonrpc":"2.0"
	};
	var req = http.request(options, onSuccess, onFailure);
	req.on('error', onFailure);
	req.write(JSON.stringify(jsonrpc));
	req.end();
}
