'use strict';

var https = require('https');
var ionic = require('./config').ionic;

var options = {
	hostname: 'api.ionic.io',
	port: '443',
	path: '/push/notifications',
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'Authorization': 'Bearer ' + ionic.jwt
	}
};

exports.post = function(message, devices) {
	return new Promise((resolve, reject) => {
		var req = https.request(options, (response) => {
		  if (response.statusCode < 200 || response.statusCode > 299) {
			 reject(new Error('HTTP : ' + response.statusCode ));
		  }
		  const body = [];
		  response.on('data', (chunk) => body.push(chunk));
		  response.on('end', () => resolve(body.join('')));
		});
		req.on('error', (err) => reject(err))
		var body = {
			"send_to_all": true,
			"profile": ionic.profile,
			"notification": {
				"message": message
			}	
		};
		req.write(JSON.stringify(body));
		req.end();
		console.log('Request sent');
	});
};

