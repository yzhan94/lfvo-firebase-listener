'use strict';

var LiferayItemUtil = require('./liferay-item-util.js')

var ignoreList = {};

function syncItem(item) {
	//TODO function not working
	console.log("SyncItem");
	if (item.id) 	{
		if (item.liferay) {
			ignoreList[item.id] = true;
			snapshot.ref().child("/liferay").remove();
		} else if (ignoreList[item.id]) {
			ignoreList[item.id] = null;
		} else {
			LiferayItemUtil.addOrUpdate(item, function(response) {
				var body = '';
				response.on('data', function (chunk) {
					body += chunk;
				});
				response.on('end', function () {
					console.info("Item updated\n");
				});
			}, function(error) {
				console.log(error);
			});
		}
	}
	else {
		/* Add item on LR */
		LiferayItemUtil.addOrUpdate(item, function(response) {
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
					}
				}
			});
		}, function(error) {
			console.log(error);
		});
	}
}

function itemAdded(snapshot) {
	var item = snapshot.val();
	if (!item.id) {
		LiferayItemUtil.addOrUpdate(item, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function() {
				if (response.statusCode == 200) {
					var newItem = JSON.parse(body).result;
					console.log("Item added - id: %d", newItem.itemId);
					if (newItem.itemId) {
						snapshot.ref().update({
							"id": Number(newItem.itemId),
							"modifiedAt": Number(newItem.modifiedDate),
							"liferay": true
						});
					}
				}
				else {
					console.error("Error adding item: %s ", body);
				}
			});
		}, function(error) {
			console.error("Error adding item: %s ", error);
		});
	}
};

function itemRemoved(snapshot) {
	var item = snapshot.val();
	LiferayItemUtil.delete(item.id, function(response) {
		var body = '';
		response.on('data', function (chunk) {
			body += chunk;
		});
		response.on('end', function () {
			if (response.statusCode == 200) {
				console.log("Item removed - id: %d", item.id);
			} else {
				console.error("Error removing item: %s ", body);
			}
		});
	}, function(error) {
		console.error("Error removing item: %s ", error);
	});
};

function itemUpdated(snapshot) {
	var item = snapshot.val();
	if (item.liferay) {
		ignoreList[item.id] = true;
		snapshot.ref().child("/liferay").remove();
	} else if (ignoreList[item.id]) {
		ignoreList[item.id] = null;
	} else {
		LiferayItemUtil.addOrUpdate(item, function(response) {
			var body = '';
			response.on('data', function (chunk) {
				body += chunk;
			});
			response.on('end', function () {
				if (response.statusCode == 200) {
					console.log("Item updated - id: %d", item.id);
				} else {
					console.error("Error updating item: %s ", body);
				}
			});
		}, function(error) {
			console.error("Error updating item: %s ", error);
		});
	}
};

/* Item listeners */
exports.listen = function(itemRef) {
	itemRef.child('alert').on('child_removed', itemRemoved);
	itemRef.child('alert').on('child_changed', itemUpdated);
	itemRef.child('alert').on('child_added', itemAdded);
}

/* Resync items */
exports.resync = function(itemRef, TIMESTAMP) {
	console.log("StartSync");
	//TODO found alerts sync?
	itemRef.child('alert').child('lost').orderByChild("modifiedAt").startAt(TIMESTAMP).once('value', function(snapshot) {
		var items = snapshot.val();
		/* Push unsynced changes to Liferay */
		for (var key in items) {
			syncItem(items.key);
		}
	});
}
