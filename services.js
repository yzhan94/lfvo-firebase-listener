'use strict';
var LiferayService = require('./liferay-service.js');

var itemWS = new LiferayService('/api/jsonws/lfvo-portlet.item');
itemWS.addMethod = 'add-or-update-item';
itemWS.addParams = function(item) {
	return {
		"+item" : "net.indaba.lostandfound.model.impl.ItemImpl",
		"item.itemId" : item.id,
		"item.groupId" : item.office,
		"item.name" : item.name,
		"item.description" : item.description,
		"item.type" : item.type,
		"item.new" : true,
		"serviceContext.assetCategoryIds" : item.category
	};
};
itemWS.updateMethod = 'add-or-update-item';
itemWS.updateParams = function(item) {
	return {
		"+item" : "net.indaba.lostandfound.model.impl.ItemImpl",
		"item.itemId" : item.id,
		"item.groupId" : item.office,
		"item.name" : item.name,
		"item.description" : item.description,
		"item.type" : item.type,
		"serviceContext.assetCategoryIds" : item.category
	};
};
itemWS.deleteMethod = 'delete-item';
itemWS.deleteParams = function(item) {
	return {
		"itemId" : item.id
	};
};
exports.itemWS = itemWS;


var imageWS = new LiferayService('/api/jsonws/lfvo-portlet.lfImage');
imageWS.addMethod = 'add-lf-image';
imageWS.addParams = function(image) {
	return {
		"imageBase64String" : image.image,
		"itemId" : image.itemId
	};
};
imageWS.updateMethod = '';
imageWS.updateParams = function(image) {
	return {
		
	};
};
imageWS.deleteMethod = 'delete-lf-image';
imageWS.deleteParams = function(image) {
	return {
		"lfImageId" : image.id
	};
};
exports.imageWS = imageWS;


var messageWS = new LiferayService('/api/jsonws/mbmessage');
messageWS.addMethod = 'add-discussion-message';
messageWS.addParams = function(message) {
	return {
		"groupId" : message.office,
		"className" : "net.indaba.lostandfound.model.Item",
		"classPK" : message.itemId,
		"threadId" : 0,
		"parentMessageId" : 0,
		"subject" : message.subject,
		"body" : message.body
	};
};
messageWS.updateMethod = 'update-discussion-message';
messageWS.updateParams = function(message) {
	return {
		"className" : "net.indaba.lostandfound.model.Item",
		"classPK" : message.itemId,
		"messageId" : message.id,
		"subject" : message.subject,
		"body" : message.body
	};
};
messageWS.deleteMethod = 'delete-message';
messageWS.deleteParams = function(message) {
	return {
		"messageId" : message.id
	};
};
exports.messageWS = messageWS;
