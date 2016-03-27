'use strict'

var http = require('http');

var options = {
	hostname: 'localhost',
	port: 8080,
	auth: 'test@liferay.com:test',
	path: '/api/jsonws/lfvo-portlet.lfimage',
	method: 'POST',
};

exports.add = function (image, onSuccess, onFailure) {
	var imageString = image.image;
	imageString = imageString.split("base64,")[1];
	var jsonrpc = {
		"method":"add-lf-image",
		"params": {
			"imageBase64String": imageString,
			"itemId": image.itemId,
			"updateFirebase": false
		},
		"jsonrpc":"2.0"
	};
	
	var req = http.request(options, onSuccess);
	req.on('error', onFailure);
	req.write(JSON.stringify(jsonrpc));
	req.end();
};

exports.delete = function (imageId, onSuccess, onFailure) {
		var jsonrpc = {
				"method":"delete-lf-image",
				"params": {
						"lfImageId": imageId,
						"updateFirebase": false
				},
				"jsonrpc":"2.0"
		};
		var req = http.request(options, onSuccess, onFailure);
		req.on('error', onFailure);
		req.write(JSON.stringify(jsonrpc));
		req.end();
}
