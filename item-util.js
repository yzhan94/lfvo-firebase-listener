'use strict';

var LiferayItemUtil = require('./liferay-item-util.js')

var ignoreList = {};

function syncItem(item, itemRef, callback) {
	var snapshot = {
		val : function() { return item; },
		ref : function() { return itemRef; }
	};
	if (item.liferay) {
		itemRef.child('liferay').remove();
	} else if (item.id) { // Item update
		itemUpdated(snapshot, callback);
	} else { // Item add
		itemAdded(snapshot, callback);
	}
}

function itemAdded(snapshot, callback) {
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
						ignoreList[newItem.itemId] = true;
						snapshot.ref().update({
							"id": Number(newItem.itemId),
							"modifiedAt": Number(newItem.modifiedDate),
						});
					}
				}
				else {
					console.error("Error adding item: %s ", body);
				}
				if (typeof callback == 'function') callback(); 
			});
		}, function(error) {
			if (typeof callback == 'function') callback();
			console.error("Error adding item: %s ", error);
		});
	}
};

function itemRemoved(snapshot, callback) {
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
			if (typeof callback == 'function') callback();
		});
	}, function(error) {
		if (typeof callback == 'function') callback();
		console.error("Error removing item: %s ", error);
	});
};

function itemUpdated(snapshot, callback) {
	var item = snapshot.val();
	if (item.liferay) {
		ignoreList[item.id] = true;
		snapshot.ref().child("/liferay").remove();
		if (typeof callback == 'function') callback();
	} else if (ignoreList[item.id]) {
		ignoreList[item.id] = null;
		if (typeof callback == 'function') callback();
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
				if (typeof callback == 'function') callback();
			});
		}, function(error) {
			console.error("Error updating item: %s ", error);
			if (typeof callback == 'function') callback();
		});
	}
};

/* Item listeners */
exports.listen = function(itemRef) {
	itemRef.child('alert').on('child_removed', itemRemoved);
	itemRef.child('alert').on('child_changed', itemUpdated);
	itemRef.child('alert').on('child_added', itemAdded);
	console.log('Item listeners enabled.');
}

/* Resync items */
exports.resync = function(itemRef, TIMESTAMP, shared_callback) {
	console.log("StartSync Item");
	itemRef.child('alert').orderByChild("modifiedAt").startAt(TIMESTAMP).once('value', function(snapshot) {
		var items = snapshot.val();
		var counter = items ? Object.keys(items).length+1 : 1;
		var callback = function() {
			counter--;
			if (counter == 0) {
				console.log("EndSync Item");
				shared_callback();
			}
		};
		/* Push unsynced changes to Liferay */
		for (var key in items) {
			syncItem(items[key], itemRef.child('alert/' + key), callback);
		}
		callback();
	});
}

