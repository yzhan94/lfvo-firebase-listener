'use strict';

var Firebase = require('firebase');
//var FirebaseTokenGenerator = require('firebase-token-generator');
//var ItemUtil = require('./item-util.js');
//var ImageUtil = require('./image-util.js');
//var MessageUtil = require('./message-util.js');

var ModelListener = require('./model-listener');
var LiferayServices = require('./lr-services');

var ref = new Firebase('https://brilliant-torch-8285.firebaseio.com/');

var itemRef = ref.child('items/alert');
var imageRef = ref.child('images');
var messageRef = ref.child('messages');

var itemModel = {
	"name" : "Item",
	"lrIdFieldName" : "itemId",
	"fbIdFieldName" : "id",
	"relations" :   {
		"categories": {
	    "type": "one",
	    "refField": "category",
	    "idField": "$id",
	    "lrField": "categoryId"
	  }
	}
};

var ItemUtil = new ModelListener(itemModel, itemRef, LiferayServices.itemWS);

var imageModel = {
	"name" : "Image",
	"lrIdFieldName" : "lfImageId",
	"fbIdFieldName" : "id",
	"relations" :   {
		"items": {
	    "type": "one",
	    "refField": "item",
	    "idField": "id",
	    "lrField": "itemId"
	  }
	}
};

var ImageUtil = new ModelListener(imageModel, imageRef,
	LiferayServices.imageWS);

var messageModel = {
	"name" : "Message",
	"lrIdFieldName" : "messageId",
	"fbIdFieldName" : "id",
	"relations" :   {
		"items": {
	    "type": "one",
	    "refField": "item",
	    "idField": "id",
	    "lrField": "classPK"
	  }
	}
};

var MessageUtil = new ModelListener(messageModel, messageRef,
	LiferayServices.messageWS);

/* Authentication (unnecessary for now)
 *
 *	var tokenGenerator = new FirebaseTokenGenerator(SECRET);
 *	var SECRET = '<YOUR_SECRET_KEY>';
 *	var token = tokenGenerator.createToken({ uid: "lfvo-listener" });
 *
 *	itemRef.authWithCustomToken(token, function(error, authData) {
 *		if (error) {
 *			console.log("Authentication Failed!", error);
 *		} else {
 *			console.log("Authenticated successfully with payload:", authData);
 *		}
 *	});
*/

/* Log module activity */
var updateTS=true;
function updateTimestamp() {
	if (updateTS) {
		ref.child("_TIMESTAMP/NodeJS").set(Firebase.ServerValue.TIMESTAMP);
		updateTS=false;
	}	else {
		updateTS=true;
	}
};

ref.on('value', updateTimestamp);
ref.child('_TIMESTAMP/NodeJS').once('value').then((snapshot) => {
	//var timestamp = snapshot.val();
	var timestamp = 0;
	if (!timestamp) timestamp = 0;
	ItemUtil.start(timestamp).then(() => {
		ImageUtil.start(timestamp);
		MessageUtil.start(timestamp);
	});
}).catch((error) => {
	console.error("%s", error);
});
