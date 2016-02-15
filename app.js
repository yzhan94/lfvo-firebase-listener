'use strict';

var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');
var https = require('http');
var FirebaseQueue = require('firebase-queue');

/**
** Item definition
**   id: {
**     .........
**   }
**/

var ref = new Firebase('https://brilliant-torch-8285.firebaseio.com/');
var itemRef = ref.child('items');


/* Authentication (unnecessary for now)
var SECRET = '<YOUR_SECRET_KEY>';
var tokenGenerator = new FirebaseTokenGenerator(SECRET);
var token = tokenGenerator.createToken({ uid: "lfvo-listener" });

itemRef.authWithCustomToken(token, function(error, authData) {
	if (error) {
		console.log("Authentication Failed!", error);
	} else {
		console.log("Authenticated successfully with payload:", authData);
	}
});
*/

function getOptions(method, options, itemId) {
	var options = {
		hostname: 'localhost',
		port: 8080,
		auth: 'test@liferay.com:test',
		path: '/api/jsonws/lfvo-portlet.item/' + options,
		method: method,
	};
	return options;
}

function itemAdded(localRef) {
	return function(snapshot) {
		var localItem = snapshot.val();
		if (!localItem.id) {
			var options = getOptions('GET', 'add-item-remote/name/' + localItem.name);
			var req = https.request(options, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function() {
					if (response.statusCode == 200) {
						console.log('Response: ' + body);
						var item = JSON.parse(body);
						localRef.child(snapshot.key()).update({"id": item.itemId})
					}
				});
			}).on('error', function(err) {
				console.log(err);
			});
			//var postData = JSON.stringify(json);
			//req.write(JSON.stringify(snapshot.val());
			req.end();
		}
	}
};

function itemRemoved(snapshot) {
	var item = snapshot.val();
	var options = getOptions('POST', '/remove-item-remote/item-id/' + item.id, "");
	https.request(options, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				//item removed
			}
		});
	}).end();
};

function itemUpdated(snapshot) {
	var item = snapshot.val();
	if (item.id) {
		console.log("Updated: ")
		var options = getOptions('POST', 'update-item-remote/item-id/' + item.id + '/name/' + item.name);
		https.request(options, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function () {
				console.log(body);
			});
		}).end();
	}
};

itemRef.child('alert').child('lost').on('child_added', itemAdded(itemRef.child('alert').child('lost')));
itemRef.child('alert').child('found').on('child_added', itemAdded(itemRef.child('alert').child('found')));

itemRef.child('alert').child('lost').on('child_removed', itemRemoved);
itemRef.child('alert').child('found').on('child_removed', itemRemoved);

itemRef.child('alert').child('lost').on('child_changed', itemUpdated);
itemRef.child('alert').child('found').on('child_changed', itemUpdated);
