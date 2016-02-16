'use strict';

var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');
var FirebaseQueue = require('firebase-queue');
var LiferayREST = require('./liferay_util.js')

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


function itemAdded(localRef) {
	return function(snapshot) {
		var item = snapshot.val();
		if (!item.id) {
			LiferayREST.addOrUpdate(item, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function() {
					if (response.statusCode == 200) {
						var newItem = JSON.parse(body).result;
						if (newItem.itemId)
							localRef.child(snapshot.key()).update({"id": Number(newItem.itemId)})
					}
				});
			}, function(error) {
				console.log(error);
			});
		}
	}
};

function itemRemoved(snapshot) {
	var item = snapshot.val();
	LiferayREST.delete(itemId, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				//item removed
			}
		});
	}, function(error) {
		console.log(error);
	});

};

function itemUpdated(snapshot) {
	var item = snapshot.val();
	if (item.id) {
		LiferayREST.addOrUpdate(item, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function () {
				console.log(body);
			});
		}, function(error) {
			console.log(error);
		});
	}
};


itemRef.child('alert').child('lost').on('child_added', itemAdded(itemRef.child('alert').child('lost')));
itemRef.child('alert').child('found').on('child_added', itemAdded(itemRef.child('alert').child('found')));

itemRef.child('alert').child('lost').on('child_removed', itemRemoved);
itemRef.child('alert').child('found').on('child_removed', itemRemoved);

itemRef.child('alert').child('lost').on('child_changed', itemUpdated);
itemRef.child('alert').child('found').on('child_changed', itemUpdated);
