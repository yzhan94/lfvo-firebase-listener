'use strict'

var liferay = require('./liferay.json');
var http = liferay.hostname.startsWith('https')
	? require('https') : require('http');

function LiferayService(servicePath) {
	this._options = {
		hostname: liferay.hostname,
		port: liferay.port,
		auth: liferay.auth,
		path: servicePath,
		method: 'POST',
	};
};

LiferayService.prototype._liferayRequest = function(jsonrpc) {
	return new Promise((resolve, reject) => {
    var req = http.request(this._options, (response) => {
      if (response.statusCode < 200 || response.statusCode > 299) {
         reject(new Error('HTTP : ' + response.statusCode));
       }
      const body = [];
      response.on('data', (chunk) => body.push(chunk));
      response.on('end', () => resolve(body.join('')));
    });
    req.on('error', (err) => reject(err))
		req.write(JSON.stringify(jsonrpc));
		req.end();
	});
};

LiferayService.prototype.add = function(entity) {
	var jsonrpc = {
		"method": this.addMethod,
		"params": this.addParams(entity),
		"jsonrpc": "2.0"
	};
	return this._liferayRequest(jsonrpc);
};
LiferayService.prototype.update = function(entity) {
	var jsonrpc = {
		"method": this.updateMethod,
		"params": this.updateParams(entity),
		"jsonrpc": "2.0"
	};
	return this._liferayRequest(jsonrpc);
};
LiferayService.prototype.delete = function(entity) {
	var jsonrpc = {
		"method": this.deleteMethod,
		"params": this.deleteParams(entity),
		"jsonrpc": "2.0"
	};
	return this._liferayRequest(jsonrpc);
};

module.exports = LiferayService;
