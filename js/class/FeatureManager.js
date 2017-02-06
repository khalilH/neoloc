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
	this._NEO_FIN_VACATION = 'neo_fin';	
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
	console.log(id);
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



/**
 * met a jour l'affichage des positions sur la carte
 * @param hits
 */
FeatureManager.prototype.refreshFeatures = function (hits){

		    refreshId();
		    var i, length = hits.length;
		    if (length == 0) return;
		    console.log('refresh');
		    vectorSource.clear();
		    for (i = 0; i < length ; i++) {
		      var feature = hits[i];
		      var timestamp = feature._source.neo_timestamp;
		      var delta = Date.now() - timestamp;
		      if (delta > 60*6 * MINUTE_IN_MILLIS) {
		        continue;
		      }
		      if (feature._source.neo_accur > 24) {
		        addCircle(feature, delta);
		      }
		      addMarker(feature, delta);
		    }

};



FeatureManager.prototype.update = function (userID, userType, id, index, type, accuracy, heading, speed, mapPoint){

	var doc = this.createDocument(userID, userType, mapPoint.x, mapPoint.y, accuracy, heading, speed, Date.now());
	
	var params = this.getUpdateFeatureParams(index, type, id, doc);

	var onSuccess = function(response, error){
		console.log("update ok");
        console.log(response);
        if (!allowXHR) {
          allowXHR = true;
        }		
	};
	
	this.es.indexExec(params, onSuccess, null);
	
};


FeatureManager.prototype.add = function (index, type, accuracy, heading, speed, mapPoint){

	var doc = this.createDocument(id, type, mapPoint.x, mapPoint.y, accuracy, heading, speed, Date.now());
	
	var params = this.getAddFeatureParams(index, type, doc);

	var onSuccess = function(response, error){
		console.log("ajout ok");
        console.log(response);
        if (!allowXHR) {
          allowXHR = true;
        }		
	};
	console.log(params);
	//this.es.indexExec(params, onSuccess, null);
	
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
	  if (dateFinVacation != 0) {
	    doc[this._NEO_FIN_VACATION] = dateFinVacation;
	  }
	  doc[this._NEO_X] = x;
	  doc[this._NEO_Y] = y;
	  doc[this._NEO_ACCURACY] = accuracy;
	  doc[this._NEO_TIMESTAMP] = timestamp;
	  doc[this._NEO_HEADING] = heading;
	  doc[this._NEO_SPEED] = speed;
	  return doc;
};
