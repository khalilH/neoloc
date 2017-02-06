var FeatureManager = function ()
{

};

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