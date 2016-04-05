'use strict';

var LiferayMessageUtil = require('./liferay-message-util.js');

var ignoreList = {};

/* Image listeners */
function messageAdded(snapshot) {
	var message = snapshot.val();
	if (!message.id) {
		LiferayMessageUtil.add(message, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function() {
				if (response.statusCode == 200) {
					var newImage = JSON.parse(body).result;
					if (newImage.lfImageId) {
						console.log("Image added - id: %d", newImage.lfImageId);
						snapshot.ref().update({
							"id": Number(newImage.lfImageId),
							"liferay": true
						});
					}
				} else {
					console.error("Error adding message: %s ", body);
				}
			});
		}, function(error) {
			console.error("Error adding message: %s ", error);
		});
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
				console.log("Image removed - id: %d", snapshot.id);
			} else {
				console.error("Error removing message: %s ", body);
			}
		});
	}, function(error) {
		console.error("Error removing message: %s ", error);
	});
}

exports.listen = function(messageRef) {
	messageRef.on('child_added', messageAdded);
	messageRef.on('child_removed', messageRemoved);
}
