'use strict';

var LiferayMessageUtil = require('./liferay-message-util.js');

var ignoreList = {};

function syncMessage(message, messageRef, callback) {
	var snapshot = {
		val : function() { return message; },
		ref : function() { return messageRef; }
	};
	if (message.liferay) {
		messageRef.child('liferay').remove();
	} else if (message.id) { // Message update 
		messageUpdated(snapshot, callback);
	} else { // Message add
		messageAdded(snapshot, callback);
	}
}

function checkItemId(snapshot) {
	var messageSnapshot = this.messageSnapshot;
	var callback = this.callback;
	var messageRef = messageSnapshot.ref();
	var message = messageSnapshot.val();
	if (snapshot.exists()) {
		console.log(snapshot.val());
		message.itemId = snapshot.val();
		callback(message);	
	} else {
		console.error("Error adding/updating message: Referenced item does not exist or is not synchronized.");
		if (typeof callback == 'function') callback();
	}
}
/* Message listeners */
function messageAdded(snapshot, callback) {
	var message = snapshot.val();
	var messageRef = snapshot.ref();
	var ctx = { // Create context objects for function checkItemId
		messageSnapshot : snapshot,
		callback : function(message) {
			LiferayMessageUtil.add(message, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function() {
					if (response.statusCode == 200) {
						var newMessage = JSON.parse(body).result;
						console.log("RESPONSE" + body);
						if (newMessage.messageId) {
							console.log("Message added - id: %d", newMessage.messageId);
							ignoreList[newMessage.messageId] = true;
							messageRef.update({
								"id": Number(newMessage.messageId),
							});
						}
					} else {
						console.error("Error adding message: %s ", body);
					}
					if (typeof callback == 'function') callback();
				});
			}, function(error) {
				console.error("Error adding message: %s ", error);
				if (typeof callback == 'function') callback();
			});
		}
	};
	if (!message.id) {
		var itemsRef = snapshot.ref().root().child('items');
		//itemsRef.child('office/'+message.item+'/id').once('value', checkItemId, ctx);
		itemsRef.child('alert/'+message.item+'/id').once('value', checkItemId, ctx);
	}
};

function messageRemoved(snapshot) {
	var message = snapshot.val();
	LiferayMessageUtil.delete(message.id, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				console.log("Message removed - id: %d", message.id);
			} else {
				console.error("Error removing message: %s ", body);
			}
		});
	}, function(error) {
		console.error("Error removing message: %s ", error);
	});
}

function messageUpdated(snapshot) {
	var message = snapshot.val();
	var ctx = {
		messageSnapshot : snapshot,
		callback : function(message) {
			LiferayMessageUtil.update(message, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function () {
					if (response.statusCode == 200) {
						console.log("Message updated - id: %d", message.id);
					} else {
						console.error("Error updating message: %s ", body);
					}
					if (typeof callback == 'function') callback();
				});
			}, function(error) {
				console.error("Error updating message: %s ", error);
				if (typeof callback == 'function') callback();
			});
		}
	};
	if (message.liferay) {
		ignoreList[message.id] = true;
		snapshot.ref().child("/liferay").remove();
		if (typeof callback == 'function') callback();
	} else if (ignoreList[message.id]) {
		ignoreList[message.id] = null;
		if (typeof callback == 'function') callback();
	} else {
		var itemsRef = snapshot.ref().root().child('items');
		//itemsRef.child('office/'+message.item+'/id').once('value', checkItemId, ctx);
		itemsRef.child('alert/'+message.item+'/id').once('value', checkItemId, ctx);
	}

}

exports.listen = function(messageRef) {
	messageRef.on('child_added', messageAdded);
	messageRef.on('child_changed', messageUpdated);
	messageRef.on('child_removed', messageRemoved);
	console.log('Message listeners enabled.');
}

/* Resync items */
exports.resync = function(ref, TIMESTAMP, shared_callback) {
	console.log("StartSync Message");
	ref.orderByChild("modifiedAt").startAt(TIMESTAMP).once('value', function(snapshot) {
		var messages = snapshot.val();
		/* Push unsynced changes to Liferay */
		var counter = messages ? Object.keys(messages).length+1 : 1;
		var callback = function() {
			counter--;
			if (counter == 0) {
				console.log("EndSync Message");
				shared_callback();
			}
		};
		for (var key in messages) {
			syncMessage(messages[key], ref.child(key), callback);
		}
		callback();
	});
}

