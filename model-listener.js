'use strict';

function ModelListener(model, ref, lrService) {
  this.model = model;
  this.ref = ref;
  this.lrService = lrService;
};

ModelListener.prototype._ignoreList = {};

ModelListener.prototype._syncEntity = function(entity, ref, cb) {
  var snapshot = {
    val : function() { return entity; },
    ref : function() { return ref; }
  };
  if (entity._liferay) {
    ref.child('_liferay').remove();
  } else if (entity[model.fbIdFieldName]) { // Entity update
    entityUpdated(snapshot, callback);
  } else { // Entity add
    entityAdded(snapshot, callback);
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

ModelListener.prototype.entityAdded = function(snapshot, callback) {
  var lrService = this.lrService;
  var ignoreList = this._ignoreList;
  var model = this.model;
  var entity = snapshot.val();
	if (!entity[model.fbIdFieldName]) {
    setEntityRelations(snapshot.ref().root(), model.relations, entity)
    .then((entity) => {
      lrService.add(entity).then((body) => {
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
        if (typeof callback == 'function') callback();
      });
    }).catch(function(error) {
      console.error("Error adding %s: %s ", model.name, error);
    });
	}
};

ModelListener.prototype.entityRemoved = function(snapshot, callback) {
  var lrService = this.lrService;
  var ignoreList = this._ignoreList;
  var model = this.model;
  var entity = snapshot.val();
  setEntityRelations(snapshot.ref().root(), model.relations, entity)
  .then((entity) => {
    lrService.delete(entity).then((body) => {
			console.log("%s removed - id: %d", model.name,
        entity[model.fbIdFieldName]);
			if (typeof callback == 'function') callback();
		});
  }).catch(function(error) {
    console.log(error);
  });
};

ModelListener.prototype.entityUpdated = function(snapshot, callback) {
  var ignoreList = this._ignoreList;
  var model = this.model;
  var entity = snapshot.val();
	if (entity._liferay) {
		ignoreList[entity[model.fbIdFieldName]] = true;
		snapshot.ref().child("/_liferay").remove();
		if (typeof callback == 'function') callback();
	} else if (ignoreList[entity[model.fbIdFieldName]]) {
		ignoreList[entity[model.fbIdFieldName]] = null;
		if (typeof callback == 'function') callback();
	} else {
		this.lrService.update(entity).then((response) => {
				console.log("%s updated - id: %d", model.name,
          entity[model.fbIdFieldName]);
				if (typeof callback == 'function') callback();
		}).catch((error) => {
			console.error("Error updating %s: %s ", model.name, error);
			if (typeof callback == 'function') callback();
		});
	}
};

/* Enable listeners */
ModelListener.prototype.listen = function() {
	this.ref.on('child_removed', this.entityRemoved, this);
	this.ref.on('child_changed', this.entityUpdated, this);
	this.ref.on('child_added', this.entityAdded, this);
	console.log('**%s listeners enabled**', this.model.name);
};

/* Resync entities */
ModelListener.prototype.resync = function(TIMESTAMP, shared_callback) {
  var model = this.model;
  console.log("StartSync %s---", model.name);
	this.ref.orderByChild("modifiedAt").startAt(TIMESTAMP)
    .once('value', function(snapshot) {
  		var entities = snapshot.val();
  		var counter = entities ? Object.keys(entities).length+1 : 1;
  		var callback = function() {
  			counter--;
  			if (counter == 0) {
  				console.log("---EndSync %s", model.name);
  				shared_callback();
  			}
  		};
  		/* Push unsynced changes to Liferay */
  		for (var key in entities) {
  			_syncEntity(entities[key], this.ref.child(key), callback);
  		}
  		callback();
	});
};

module.exports = ModelListener;
