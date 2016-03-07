'use strict';

var Firebase = require('firebase');
//var FirebaseTokenGenerator = require('firebase-token-generator');
var LiferayREST = require('./liferay_util.js')

/**
** Item definition
**   id: {
**     .........
**   }
**/

var ignoreList = {};
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

function updateTimestamp() {
	ref.child("/_TIMESTAMP/NodeJS").set(Firebase.ServerValue.TIMESTAMP);
}

function itemAdded(snapshot) {
	var item = snapshot.val();
	item.type = snapshot.ref().parent().key();
	if (!item.id) {
		LiferayREST.addOrUpdate(item, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function() {
				if (response.statusCode == 200) {
					var newItem = JSON.parse(body).result;
					console.info("Item added "+ newItem.itemId + "\n");
					if (newItem.itemId) {
						snapshot.ref().update({
							"id": Number(newItem.itemId),
							"liferay": true
						});
						updateTimestamp();
					}
				}
			});
		}, function(error) {
			console.log(error);
		});
	}
};


function itemRemoved(snapshot) {
	var item = snapshot.val();
	LiferayREST.delete(item.id, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				//item removed
				console.info("Item removed\n");
				updateTimestamp();
			}
		});
	}, function(error) {
		console.log(error);
	});

};

function itemUpdated(snapshot) {
	var item = snapshot.val();
	if (item.liferay) {
		ignoreList[item.id] = true;
		snapshot.ref().child("/liferay").remove();	
		updateTimestamp();
	} else if (ignoreList[item.id]) {
		ignoreList[item.id] = null;
	} else {
		LiferayREST.addOrUpdate(item, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function () {
				console.info("Item updated\n");
				updateTimestamp();
			});
		}, function(error) {
			console.log(error);
		});
	}
};


itemRef.child('alert').child('lost').on('child_added', itemAdded);
itemRef.child('alert').child('found').on('child_added', itemAdded);

itemRef.child('alert').child('lost').on('child_removed', itemRemoved);
itemRef.child('alert').child('found').on('child_removed', itemRemoved);

itemRef.child('alert').child('lost').on('child_changed', itemUpdated);
itemRef.child('alert').child('found').on('child_changed', itemUpdated);
