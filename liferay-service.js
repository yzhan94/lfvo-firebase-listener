'use strict'

var http = require('http');
var liferay = require('./liferay.json');

function LiferayService(servicePath) {
	this._options = {
		hostname: liferay.hostname,
		port: liferay.port,
		auth: liferay.auth,
		path: servicePath,
		method: 'POST',
	};
};

LiferayService.prototype._liferayRequest = function(jsonrpc, onSuccess,
	onFailure) {
		var req = http.request(this._options, onSuccess);
		req.on('error', onFailure);
		req.write(JSON.stringify(jsonrpc));
		req.end();
	};

LiferayService.prototype.add = function(entity, onSuccess, onFailure) {
	var jsonrpc = {
		"method": this.addMethod,
		"params": this.addParams(entity),
		"jsonrpc": "2.0"
	};
	this._liferayRequest(jsonrpc, onSuccess, onFailure);
};
LiferayService.prototype.update = function(entity, onSuccess, onFailure) {
	var jsonrpc = {
		"method": this.updateMethod,
		"params": this.updateParams(entity),
		"jsonrpc": "2.0"
	};
	this._liferayRequest(jsonrpc, onSuccess, onFailure);
};
LiferayService.prototype.delete = function(entity, onSuccess, onFailure) {
	var jsonrpc = {
		"method": this.deleteMethod,
		"params": this.deleteParams(entity),
		"jsonrpc": "2.0"
	};
	this._liferayRequest(jsonrpc, onSuccess, onFailure);
};

module.exports = LiferayService;
