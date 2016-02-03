'use strict';

var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');
var https = require('https');
var querystring = require('querystring');

/**
** Item definition
**   id: { 
**     .........
**     sync : true|false 
**   }
**/

var itemRef = new Firebase('https://brilliant-torch-8285.firebaseio.com/items');

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

function setSync(ref, val) {
	ref.update({
		"sync": val
	});
}

function getOptions(method, itemId) {
	var options = {
		hostname: 'brilliant-torch-8285.firebaseio.com',
		path: '/lr-mockdb/items/' + itemId + '.json',
		method: method,
	};
	return options;
}

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


