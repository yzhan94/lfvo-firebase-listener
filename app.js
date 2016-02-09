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
var cQueueRef = ref.child('cqueue');
var uQueueRef = ref.child('uqueue');
var dQueueRef = ref.child('dqueue');

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

var createQueue = new FirebaseQueue(cQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('GET', 'add-item/name/' + data.name);
	var req = https.request(options, function(response) {
		console.log(response.statusCode);
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function() {
			if (response.statusCode == 200) {
				console.log('Response: ' + body);
				var item = JSON.parse(body);
				data.id = item.itemId;
				itemRef.push(data);
				resolve(data);
			}
		});
	}).on('error', function(err) {
		console.log(err);
	});
	//var postData = JSON.stringify(json);
	req.write(JSON.stringify(data));
	req.end();
});

var updateQueue = new FirebaseQueue(uQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('POST', 'update-item/item-id/' + data.id + '/name/' + data.name);
	https.request(options, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			console.log(body);
			if (response.statusCode == 200) {
				itemRef.orderByChild('id').equalTo(data.id).on('child_added', function(snapshot) {
					if (snapshot.val().id == data.id) {
						itemRef.child(snapshot.key()).update(data, function(error) {
							if (error) {
								reject(data);
							} else {
								resolve(data);
							}
						});
					}
				});
			} else {
				reject(data);
			}
		});
	}).end();
});

var deleteQueue = new FirebaseQueue(dQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('POST', '/remove-item/item-id/' + data.id, "");
	https.request(options, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				itemRef.orderByChild('id').equalTo(data.id).on('child_added', function(snapshot) {
					if (snapshot.val().id == data.id) {
						itemRef.child(snapshot.key()).set(null, function(error) {
							if (error) {
								reject(data);
							} else {
								resolve(data);
							}
						});
					}
				});
			} else {
				reject(data);
			}
		});
	}).end();
});

/*

itemRef.on('child_added', function(snapshot) {
	if (!snapshot.val().sync) {
		var options = getOptions('PUT', snapshot.key());
		var req = https.request(options, function(response) {
			if (response.statusCode == 200) {
				setSync(itemRef.child(snapshot.key()), true);
				console.log('item added: ' + snapshot.key());
			}
		});
		var data = JSON.stringify(snapshot.val());
		req.write(data);
		req.end();
	}
});

itemRef.on('child_removed', function(snapshot) {
	if (!snapshot.val().sync) {
		var options = getOptions('DELETE', snapshot.key());
		var req = https.request(options, function(response) {
			if (response.statusCode == 200) {
				console.log('item removed: ' + snapshot.key());
			}
		});
		req.end();
	}
});

itemRef.on('child_changed', function(snapshot) {
	if (!snapshot.val().sync) {
		var options = getOptions('PATCH', snapshot.key());
		var req = https.request(options, function(response) {
			if (response.statusCode == 200) {
				setSync(itemRef.child(snapshot.key()), true);
				console.log('item changed: ' + snapshot.key());
			}
		});
		var data = JSON.stringify(snapshot.val());
		req.write(data);
		req.end();
	}
});
*/
