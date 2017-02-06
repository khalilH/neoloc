var FeatureManager = function ()
{

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
FeatureManager.prototype.getFeature = function (index, type, id){
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