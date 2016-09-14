'use strict';

var Firebase = require('firebase');
var IonicPush = require('./ionic-push');

function ModelListener(model, ref, lrService) {
  this.model = model;
  this.ref = ref;
  this.lrService = lrService;
};

ModelListener.prototype._ignoreList = {};

ModelListener.prototype._syncEntity = function(entity, ref) {
	var model = this.model;
	var snapshot = {
		val : () => { return entity; },
		ref : () => { return ref; }
	};
	if (entity._liferay) {
		return new Promise((resolve, reject) => {
			ref.child('_liferay').remove();
			resolve();
		});
	} else if (entity[model.fbId]) { // Entity update
		return this.entityUpdated(snapshot);
	} else { // Entity add
		return this.entityAdded(snapshot);
	}
};

function getRefId(ref, idFieldName) {
  return ref.once('value').then((snapshot) => {
    if (snapshot.exists()) {
      if (idFieldName == "$id") {
        return snapshot.key();
      } else {
        var relatedEntity = snapshot.val();
        return relatedEntity[idFieldName];
      }
    } else {
      throw new Error("Referenced entity not found in " + ref.toString());
    }
  });
};

function getRefPromises(ref, relations, entity) {
  var promises = [];
  for (var key in relations) {
    var relation = relations[key];
    var refKey = entity[relation.refField];
    if (refKey) {
      var valRef = ref.child(key).child(refKey);
      promises.push(getRefId(valRef, relation.fbId));
    }
  }
  return promises;
};

function setEntityRelations(firebaseRef, relations, entity) {
  var promises = getRefPromises(firebaseRef, relations, entity);
  return Promise.all(promises).then((results) => {
    var i = 0;
    for(var key in relations) {
      var relation = relations[key];
      var refKey = entity[relation.refField];
      if (refKey) {
        entity[relation.lrId] = results[i++];
      }
    }
    return entity;
  });
};

ModelListener.prototype.entityAdded = function(snapshot) {
	var lrService = this.lrService;
	var ignoreList = this._ignoreList;
	var model = this.model;
	var entity = snapshot.val();
	var currentTime = Date.now();
	var diff = currentTime - snapshot.val().createdAt;
	if (snapshot.ref().parent().key() === 'alert' && 
		diff < 100000 /*TODO push notification condition*/) {
		IonicPush.post('New item alert: ' + entity.name, {'itemId': snapshot.key()}).then((response) => {
			console.log(JSON.parse(response));
		}).catch((error) => {
			console.log(error);
		});
	}
	if (!entity[model.fbId]) {
    return setEntityRelations(snapshot.ref().root(), model.relations, entity)
    .then((entity) => {
      return lrService.add(entity).then((body) => {
        var newEntity = JSON.parse(body).result;
        console.log("%s added - id: %d", model.name,
        newEntity[model.lrId]);
        if (newEntity[model.lrId]) {
          ignoreList[newEntity[model.lrId]] = true;
          var updatedEntity = {};
          updatedEntity[model.fbId] =
            Number(newEntity[model.lrId]);
          updatedEntity["modifiedAt"] = newEntity.modifiedDate ?
            Number(newEntity.modifiedDate) : null
          snapshot.ref().update(updatedEntity);
        }
        this.ref.root().child('_TIMESTAMP').set(Firebase.ServerValue.TIMESTAMP);
      });
    }).catch((error) => {
      console.error("Error adding %s: %s ", model.name, error);
    });
	}
};

ModelListener.prototype.entityRemoved = function(snapshot) {
  var lrService = this.lrService;
  var ignoreList = this._ignoreList;
  var model = this.model;
  var entity = snapshot.val();
  return setEntityRelations(snapshot.ref().root(), model.relations, entity)
  .then((entity) => {
    return lrService.delete(entity).then((body) => {
		console.log("%s removed - id: %d", model.name,
        entity[model.fbId]);
      this.ref.root().child('_TIMESTAMP').set(Firebase.ServerValue.TIMESTAMP);
		});
  }).catch((error) => {
    console.log(error);
  });
};

ModelListener.prototype.entityUpdated = function(snapshot) {
  var ignoreList = this._ignoreList;
  var model = this.model;
  var entity = snapshot.val();
  var promise = new Promise((resolve, reject) => {
    if (entity._liferay) {
      ignoreList[entity[model.fbId]] = true;
      snapshot.ref().child("/_liferay").remove();
    } else if (ignoreList[entity[model.fbId]]) {
      ignoreList[entity[model.fbId]] = null;
    } else {
      return this.lrService.update(entity).then((response) => {
        console.log("%s updated - id: %d", model.name,
          entity[model.fbId]);
        this.ref.root().child('_TIMESTAMP').set(Firebase.ServerValue.TIMESTAMP);
        resolve();
      }).catch((error) => {
        console.error("Error updating %s: %s ", model.name, error);
        reject(error);
      });
    }
    resolve();
  });
  return promise;
};

/* Enable listeners */
ModelListener.prototype._listen = function() {
	this.ref.on('child_removed', this.entityRemoved, this);
	this.ref.on('child_changed', this.entityUpdated, this);
	this.ref.on('child_added', this.entityAdded, this);
	console.log('**%s listeners enabled**', this.model.name);
};

/* Resync entities */
ModelListener.prototype.start = function(TIMESTAMP) {
  var model = this.model;
	return this.ref.orderByChild("modifiedDate").startAt(TIMESTAMP).once('value')
    .then((snapshot) => {
      console.log("StartSync %s---", model.name);
  		var entities = snapshot.val();
      var promises = [];
  		/* Push unsynced changes to Liferay */
  		for (var key in entities) {
        var p = this._syncEntity(entities[key], this.ref.child(key));
  			promises.push(p);
  		}
      return Promise.all(promises)
      .then(() => {
        console.log("---EndSync %s", model.name);
        this._listen();
      });
	});
};

ModelListener.prototype.restart = function(TIMESTAMP) {
  this.ref.off('child_removed', this.entityRemoved, this);
  this.ref.off('child_changed', this.entityUpdated, this);
  this.ref.off('child_added', this.entityAdded, this);
  console.log('**%s listeners disabled**', this.model.name);
  return this.start(TIMESTAMP);
}

module.exports = ModelListener;
