'use strict';

var LiferayService = require('./liferay-service.js');

var lrItemWS = new LiferayService('/api/jsonws/lfvo-portlet.item');
lrItemWS.addMethod = lrItemWS.updateMethod = 'add-or-update-item';
lrItemWS.addParams = lrItemWS.updateParams = function(item) {
	if (item.category) {
		var itemCategories = '' + item.category;
	}
	return {
		"+item": "net.indaba.lostandfound.model.impl.ItemImpl",
		"item.itemId": item.id ? item.id : 0,
		"item.groupId": item.office,
		"item.name": item.name,
		"item.description": item.description,
		"item.type": item.type,
		"item.new": item.id ? false : true,
		"serviceContext.assetCategoryIds": itemCategories
	};
};

lrItemWS.deleteMethod = 'delete-item';
lrItemWS.deleteParams = function(item) {
	return {
		"itemId" : item.id
	};
};

var lrImageWS = new LiferayService('/api/jsonws/lfvo-portlet.lfimage');
lrImageWS.addMethod = 'add-lf-image';
lrImageWS.addParams = function(image) {
	var imageString = image.image;
	imageString = imageString.split("base64,")[1];
	return {
		"imageBase64String": imageString,
		"itemId": image.itemId,
	};
};
lrImageWS.deleteMethod = 'delete-lf-image';
lrImageWS.deleteParams = function(image) {
	return {
		"lfImageId": image.id,
	};
};

var lrMessageWS = new LiferayService('/api/jsonws/mbmessage');
lrMessageWS.addMethod = 'add-discussion-message';
lrMessageWS.addParams = function(message) {
	return {
		"groupId": message.office,
		"className": "net.indaba.lostandfound.model.Item",
		"classPK": message.classPK,
		"threadId": 0,
		"parentMessageId": 0,
		"subject": message.subject,
		"body": message.body,
	};
};
lrMessageWS.updateMethod = 'update-discussion-message';
lrMessageWS.updateParams = function(message) {
	return {
		"className": "net.indaba.lostandfound.model.Item",
		"classPK": message.itemId,
		"messageId": message.id,
		"subject": message.subject,
		"body": message.body,
	};
};
lrMessageWS.deleteMethod = 'delete-message';
lrMessageWS.deleteParams = function(message) {
	return {
		"messageId": message.id
	};
};

exports.itemWS = lrItemWS;
exports.imageWS = lrImageWS;
exports.messageWS = lrMessageWS;
