'use strict';

var Firebase = require('firebase');
var FirebaseTokenGenerator = require('firebase-token-generator');

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

itemRef.on('child_added', function(snapshot) {
	if (!snapshot.val().sync) {
		setSync(itemRef.child(snapshot.key()), true);
		console.log('item added: ' + snapshot.key());
	}
});

itemRef.on('child_removed', function(snapshot) {
	if (!snapshot.val().sync) {

		console.log('item removed: ' + snapshot.key());
	}
});

itemRef.on('child_changed', function(snapshot) {
	if (!snapshot.val().sync) {
		setSync(itemRef.child(snapshot.key()), true);
		console.log('item changed: ' + snapshot.key());
	}
});


