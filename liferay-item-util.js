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
	/* Categories not implemented yet
	**
	var itemCategories = '' + item.categories[0];
	for (var i = 0; i < item.categories.length; i++)
	itemCategories += ', ' + item.categories[i];
	*/
	var jsonrpc = {
		"method":"add-or-update-item",
		"params": {
			"+item": "net.indaba.lostandfound.model.impl.ItemImpl",
			"item.itemId": item.id ? item.id : 0,
			"item.groupId": item.groupId,
			"item.name": item.name,
			"item.description": item.description,
			"item.type": item.type,
			"item.new": true,
			"serviceContext.userId": 25602,
      "serviceContext.companyId": 20202,
			//"serviceContext.assetCategoryIds": itemCategories
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
