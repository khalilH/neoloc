var FeatureManager = function (es)
{
	this.es = es;
	// Attributs Elasticsearch d'une feature
	this._NEO_ID = 'neo_id';
	this._NEO_X = 'neo_x';
	this._NEO_Y = 'neo_y';
	this._NEO_ACCURACY = 'neo_accur';
	this._NEO_TIMESTAMP = 'neo_timestamp';
	this._NEO_HEADING = 'neo_heading';
	this._NEO_SPEED = 'neo_speed';
	this._NEO_TYPE = 'neo_type';
};

/**
 *
 * @param index //index de recherche
 * @returns Object
 */
FeatureManager.prototype.getFeaturesInMapExtentSearchParams = function (index){
	 var geometry = omap.getExtent();

	 return {
		        index: index,
		        body: {
		          query : {
		            "bool" : {
		              "must" : [
		                {"range" : {"neo_x": { "gte" : geometry.xmin, "lte" : geometry.xmax } } },
		                {"range" : {"neo_y": { "gte" : geometry.ymin, "lte" : geometry.ymax } } }
		              ]
		            }
		          }
		        },
		        requestTimeout: 5 * SECOND_IN_MILLIS,
		        size: 1000
		      };

};

/**
 *
 */
FeatureManager.prototype.getFeatureParams = function (index, type, id){

	return {
        index: index,
        type: type,
        body: {
          query : { match : {"neo_id" : id }}
        }
      };

};


/**
 *
 */
FeatureManager.prototype.getUpdateFeatureParams = function (index, type, id, doc){

	return {
	    index: index,
	    type: type,
	    id: id,
	    body: doc
	  };

};


/**
 *
 */
FeatureManager.prototype.getAddFeatureParams = function (index, type, doc){

	return {
	    index: index,
	    type: type,
	    body: doc
	  };

};





FeatureManager.prototype.save = function (index, type, user){

    if (user.ESid == null) {
  	  this.add(index, type, user);
    } else {
  	  this.update(index, type, user);
    }
    //console.log(user);

};

FeatureManager.prototype.update = function (index, type, user){

	var doc = this.createDocument(user.id, user.type, user.x, user.y, user.accuracy, user.heading, user.speed, Date.now());

	var params = this.getUpdateFeatureParams(index, type, user.ESid, doc);

	var onSuccess = function(response, error){
		console.log("update ok");
        console.log(response);
        if (!allowXHR) {
          allowXHR = true;
        }
	};

	this.es.indexExec(params, onSuccess, null);

};


FeatureManager.prototype.add = function (index, type, user){

	var doc = this.createDocument(user.id, user.type, user.x, user.y, user.accuracy, user.heading, user.speed, Date.now());

	var params = this.getAddFeatureParams(index, type, doc);

	var onSuccess = function(response, error){
		console.log("ajout ok");
        console.log(response);
        user.ESid = response._id;
        if (!allowXHR) {
          allowXHR = true;
        }
	};

	this.es.indexExec(params, onSuccess, null);

};

/**
 * renvoie un document contenant la position de la feature
 * @param id
 * @param type
 * @param x
 * @param y
 * @param accuracy
 * @param heading
 * @param speed
 * @param timestamp
 * @returns Object
 */
FeatureManager.prototype.createDocument = function (id, type, x, y, accuracy, heading, speed, timestamp) {
	  var doc = {};
	  doc[this._NEO_ID] = id;
	  doc[this._NEO_TYPE] = type;
	  doc[this._NEO_X] = x;
	  doc[this._NEO_Y] = y;
	  doc[this._NEO_ACCURACY] = accuracy;
	  doc[this._NEO_TIMESTAMP] = timestamp;
	  doc[this._NEO_HEADING] = heading;
	  doc[this._NEO_SPEED] = speed;
	  return doc;
};
