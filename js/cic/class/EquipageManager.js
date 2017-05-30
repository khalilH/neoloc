var EquipageManager = function (es)
{
  this.es = es;
  // Attributs Elasticsearch d'un equipage
  this._EQUIPAGE_ID = "equipage_id";
  this._EQUIPAGE_COMPOSITION = "equipage_composition";
  this._EQUIPAGE_ADS = "equipage_ADS";
  this._EQUIPAGE_FEMME = "equipage_femme";
  this._EQUIPAGE_HORS_POLICE = "equipage_hors_police";
  this._EQUIPAGE_EQUIPEMENTS = "equipage_equipements";
  this._EQUIPAGE_DATE_CREATION = "equipage_date_creation";
  this._EQUIPAGE_X = "equipage_x";
  this._EQUIPAGE_Y = "equipage_y";
  this._EQUIPAGE_ACCUR = "equipage_accur";
  this._EQUIPAGE_TYPE = "equipage_type";
  this._EQUIPAGE_TIMESTAMP = "equipage_timestamp";

};

/**
 *
 * @param index //index de recherche
 * @returns Object
 */
EquipageManager.prototype.getEquipagesInMapExtentSearchParams = function (index){
	 var geometry = omap.getExtent();

	 return {
		        index: index,
		        body: {
		          query : {
		            "bool" : {
		              "must" : [
		                {"range" : {"equipage_x": { "gte" : geometry.xmin, "lte" : geometry.xmax } } },
		                {"range" : {"equipage_y": { "gte" : geometry.ymin, "lte" : geometry.ymax } } }
		              ]
		            }
		          }
		        },
		        requestTimeout: 5 * SECOND_IN_MILLIS,
		        size: 1000
		      };

};

EquipageManager.prototype.getEquipageParams = function(index, id) {
  return {
    index: index,
    type: NEOCONFIG.es.type.equipages,
    body: {
      query : { match : {"equipage_id" : id }}
    }
  };
};
