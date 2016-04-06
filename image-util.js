'use strict';

var LiferayImageUtil = require('./liferay-image-util.js');

var ignoreList = {};

/* Image listeners */
function imageAdded(snapshot) {
	var image = snapshot.val();
	if (!image.id) {
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
						snapshot.ref().update({
							"id": Number(newImage.lfImageId),
							"liferay": true
						});
					}
				} else {
					console.error("Error adding image: %s ", body);
				}
			});
		}, function(error) {
			console.error("Error adding image: %s ", error);
		});
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
}
