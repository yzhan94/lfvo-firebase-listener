'use strict';

var Firebase = require('firebase');
//var FirebaseTokenGenerator = require('firebase-token-generator');
var ItemUtil = require('./item-util.js');
var ImageUtil = require('./image-util.js');

var ref = new Firebase('https://brilliant-torch-8285.firebaseio.com/');
var itemRef = ref.child('items');
var imageRef = ref.child('images');

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

/* Log module activity */
var updateTS=true;
function updateTimestamp() {
	if (updateTS) {
		ref.child("_TIMESTAMP/NodeJS").set(Firebase.ServerValue.TIMESTAMP);
		updateTS=false;
	}
	else {
		updateTS=true;
	}
}

ref.on('value', updateTimestamp);
ref.child('_TIMESTAMP/NodeJS').once('value', function(snapshot) {
	var timestamp = snapshot.val();
	if (!timestamp) timestamp = 0;
	ItemUtil.resync(itemRef, timestamp, function() {
		ImageUtil.resync(imageRef, timestamp, function() {
			ItemUtil.listen(itemRef);
			ImageUtil.listen(imageRef);
		});
	});
});

