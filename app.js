
'use strict';

var config = require('./config.json');
var Firebase = require('firebase');

var ModelListener = require('./model-listener');
var LiferayServices = require('./services');

var ref = new Firebase(config.firebase.url);
var itemRef= ref.child("items");
var itemModel = { 
	"name" : "item",
	"lrId" : "itemId",
	"fbId" : "id",
	"relations" : { 
	}
};
var itemListener= new ModelListener(itemModel, itemRef, LiferayServices.itemWS);
	
var imageRef= ref.child("images");
var imageModel = { 
	"name" : "image",
	"lrId" : "lfImageId",
	"fbId" : "id",
	"relations" : { 
		"items" : {
			"type" : "many-to-one",
			"refField" : "item",
			"lrId" : "itemId",
			"fbId" : "id"
		}
	}
};
var imageListener= new ModelListener(imageModel, imageRef, LiferayServices.imageWS);
	
var messageRef= ref.child("messages");
var messageModel = { 
	"name" : "message",
	"lrId" : "messageId",
	"fbId" : "id",
	"relations" : { 
		"items" : {
			"type" : "many-to-one",
			"refField" : "item",
			"lrId" : "itemId",
			"fbId" : "id"
		}
	}
};
var messageListener= new ModelListener(messageModel, messageRef, LiferayServices.messageWS);
	

function restartListeners(timestamp) {
	itemListener.restart(timestamp).then(() => {
		return imageListener.restart(timestamp);
	}).then(() => {
		return messageListener.restart(timestamp);
	}).then(() => {
		ref.child('_RESTART').set(0);
	});
}

ref.child('_RESTART').set(-1);

ref.child('_RESTART').on('value', (snapshot) => {
    var restart = snapshot.val();
    if (restart == 0) {
        //Do nothing
    } else if (restart == -1) {
        ref.child('_TIMESTAMP').once('value').then((snapshot) => {
            var timestamp = snapshot.val();
            if (!timestamp) timestamp = 0;
            restartListeners(timestamp);
         }).catch((error) => {
            console.error("%s", error);
        });
    } else {
         restartListeners(restart);
    }
});

