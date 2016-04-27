'use strict';

var LiferayImageUtil = require('./liferay-image-util.js');

var ignoreList = {};

function syncImage(image, imageRef, callback) {
	var snapshot = {
		val : function() { return image; },
		ref : function() { return imageRef; }
	};
	if (image.liferay) {
		imageRef.child('liferay').remove();
	} else if (!image.id) { // Image add
		imageAdded(snapshot, callback);
	}
}

function checkItemId(snapshot) {
	var imageSnapshot = this.imageSnapshot;
	var callback = this.callback;
	var imageRef = imageSnapshot.ref();
	var image = imageSnapshot.val();
	if (snapshot.exists()) {
		image.itemId = snapshot.val();
		callback(image);	
	} else {
		console.error("Error adding image: Referenced item does not exist or is not synchronized.");
		if (typeof callback == 'function') callback();
	}
}
/* Image listeners */
function imageAdded(snapshot, callback) {
	var image = snapshot.val();
	var ctx = { // Create context objects for function checkItemId
		imageSnapshot : snapshot,
		callback : function(image) {
			LiferayImageUtil.add(image, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function() {
					if (response.statusCode == 200) {
						var newImage = JSON.parse(body).result;
						if (newImage.lfImageId) {
							console.log("Image added - id: %d", newImage.lfImageId);
							ignoreList[newImage.lfImageId] = true;
							imageRef.update({
								"id": Number(newImage.lfImageId),
							});
						}
					} else {
						console.error("Error adding image: %s ", body);
					}
					if (typeof callback == 'function') callback();
				});
			}, function(error) {
				console.error("Error adding image: %s ", error);
				if (typeof callback == 'function') callback();
			});
		}
	};
	if (!image.id) {
		var itemsRef = snapshot.ref().root().child('items');
		//itemsRef.child('office/'+image.item+'/id').once('value', checkItemId, ctx);
		itemsRef.child('alert/'+image.item+'/id').once('value', checkItemId, ctx);
	}
};

function imageRemoved(snapshot) {
	var image = snapshot.val();
	LiferayImageUtil.delete(image.id, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				console.log("Image removed - id: %d", image.id);
			} else {
				console.error("Error removing image: %s ", body);
			}
		});
	}, function(error) {
		console.error("Error removing image: %s ", error);
	});
}

exports.listen = function(imageRef) {
	imageRef.on('child_added', imageAdded);
	imageRef.on('child_removed', imageRemoved);
	console.log('Image listeners enabled.');
}

/* Resync items */
exports.resync = function(ref, TIMESTAMP, shared_callback) {
	console.log("StartSync Image");
	ref.orderByChild("modifiedAt").startAt(TIMESTAMP).once('value', function(snapshot) {
		var images = snapshot.val();
		/* Push unsynced changes to Liferay */
		var counter = images ? Object.keys(images).length+1 : 1;
		var callback = function() {
			counter--;
			if (counter == 0) {
				console.log("EndSync Image");
				shared_callback();
			}
		};
		for (var key in images) {
			syncImage(images[key], ref.child(key), callback);
		}
		callback();
	});
}

