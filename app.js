'use strict';

var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');
var https = require('https');
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
		hostname: 'brilliant-torch-8285.firebaseio.com',
		path: '/lr-mockdb/items' + itemId + '.json' + options,
		method: method,
	};
	return options;
}

var createQueue = new FirebaseQueue(cQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('POST', "", "");
	var req = https.request(options, function(response) {
		if (response.statusCode == 200) {
			itemRef.push(data);
			resolve(data);
		}
	});
	//var postData = JSON.stringify(json);
	req.write(JSON.stringify(data));
	req.end();
});

var updateQueue = new FirebaseQueue(uQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('GET', '?orderBy="id"&equalTo="' + data.id +'"', "");
	https.request(options, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				var options = getOptions('PATCH', "", '/' + Object.keys(JSON.parse(body))[0]);
				var req = https.request(options, function(response) {
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
					}
				});
				req.write(JSON.stringify(data));
				req.end();
			} else {
				reject(data);
			}
		});
	}).end();
});

var updateQueue = new FirebaseQueue(dQueueRef, function(data, progress, resolve, reject) {
	var options = getOptions('GET', '?orderBy="id"&equalTo="' + data.id +'"', "");
	https.request(options, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				var options = getOptions('DELETE', "", '/' + Object.keys(JSON.parse(body))[0]);
				var req = https.request(options, function(response) {
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
					}
				});
				req.write(JSON.stringify(data));
				req.end();
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
