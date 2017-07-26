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
FeatureManager.prototype.getNeoInMapExtentSearchParams = function (index){
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
				id: id
        // body: {
        //   query : { match : {"neo_id" : id }}
        // }
      };

};
