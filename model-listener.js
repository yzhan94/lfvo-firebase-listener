'use strict';

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
  } else if (entity[model.fbIdFieldName]) { // Entity update
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
      promises.push(getRefId(valRef, relation.idField));
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
        entity[relation.lrField] = results[i++];
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
	if (!entity[model.fbIdFieldName]) {
    return setEntityRelations(snapshot.ref().root(), model.relations, entity)
    .then((entity) => {
      return lrService.add(entity).then((body) => {
        var newEntity = JSON.parse(body).result;
        console.log("%s added - id: %d", model.name,
        newEntity[model.lrIdFieldName]);
        if (newEntity[model.lrIdFieldName]) {
          ignoreList[newEntity[model.lrIdFieldName]] = true;
          var updatedEntity = {};
          updatedEntity[model.fbIdFieldName] =
            Number(newEntity[model.lrIdFieldName]);
          updatedEntity["modifiedAt"] = newEntity.modifiedDate ?
            Number(newEntity.modifiedDate) : null
          snapshot.ref().update(updatedEntity);
        }
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
        entity[model.fbIdFieldName]);
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
      ignoreList[entity[model.fbIdFieldName]] = true;
      snapshot.ref().child("/_liferay").remove();
    } else if (ignoreList[entity[model.fbIdFieldName]]) {
      ignoreList[entity[model.fbIdFieldName]] = null;
    } else {
      this.lrService.update(entity).then((response) => {
        console.log("%s updated - id: %d", model.name,
          entity[model.fbIdFieldName]);
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
	return this.ref.orderByChild("modifiedAt").startAt(TIMESTAMP).once('value')
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

module.exports = ModelListener;
