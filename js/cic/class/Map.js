var Map = function ()
{

};

/**
 * Permet d'obtenir les limites(extent) de la vue active de la carte en projection de lambert93
 */
Map.prototype.getExtent = function ()
{
	    var e = map.getView().calculateExtent(map.getSize());
	    var extent = {
	      'xmin': e[0],
	      'ymin': e[1],
	      'xmax': e[2],
	      'ymax': e[3]
	    };
	    return extent;

};


/**
 * met a jour l'affichage des positions sur la carte
 * @param hits
 */
Map.prototype.refreshPositionsNeo = function (hits){

		    var i, length = hits.length;
		    if (length == 0) return;
		    //console.log('refresh');
		    vectorSource.clear();
		    for (i = 0; i < length ; i++) {
		      var feature = hits[i];
		      var timestamp = feature._source.neo_timestamp;
		      var delta = Date.now() - timestamp;
		      //si delai de 6 heures, on ignore le point
		      if (delta > 6 * 60 * MINUTE_IN_MILLIS) {
		        continue;
		      }
		      //si la précision est superieure à 24
		      if (feature._source.neo_accur > 24) {
		        this.addCircleNeo(feature, delta);
		      }
		      this.addMarkerNeo(feature, delta);
		    }
};

/**
 * permet d'ajouter un marker sur la map a partir d'une feature
 *
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de la feature
 */
Map.prototype.addMarkerNeo = function(feature, delta) {
	var doc_id = feature._id;
	var neo_id = feature._source.neo_id;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var neo_type = feature._source.neo_type;
  var point = new ol.geom.Point([x, y]);
  var feat = new ol.Feature({geometry: point});
  // code couleur : bleu recent, gris ancien
	if (delta > 5 * MINUTE_IN_MILLIS) {
		feat.set('color', 'grey');
	} else {
		feat.set('color', 'blue');
	}
  feat.set('neo_id', neo_id);
  feat.set('type', neo_type);
	feat.set('doc_id', doc_id);
  feat.setStyle(markerStyle);
  vectorSource.addFeature(feat);
};


/**
 * Permet d'ajouter un cercle d'incertitude sur la map a partir d'une feature
 *
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de la feature
 */
Map.prototype.addCircleNeo = function(feature, delta) {
	var doc_id = feature._id;
  var neo_id = feature._source.neo_id;
  var radius = feature._source.neo_accur;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var circle = new ol.geom.Circle([x, y], radius);
  var feat = new ol.Feature({geometry: circle});

	if (delta > 5 * MINUTE_IN_MILLIS) {
		feat.set('color', 'grey');
	} else {
		feat.set('color', 'blue');
	}
	feat.set('doc_id', doc_id);
  feat.setStyle(circleStyle);
  vectorSource.addFeature(feat);
};

/**
 * met a jour l'affichage des positions des equipages sur la carte
 * @param hits
 */
Map.prototype.refreshPositionsEquipages = function (hits){

		    var i, length = hits.length;
		    if (length == 0) return;
		    //console.log('refresh');
		    vectorSource.clear();
		    for (i = 0; i < length ; i++) {
		      var feature = hits[i];
		      var timestamp = feature._source.equipage_timestamp;
		      var delta = Date.now() - timestamp;
		      //si delai de 6 heures, on ignore le point
		      if (delta > 6 * 60 * MINUTE_IN_MILLIS) {
		        continue;
		      }
		      //si la précision est superieure à 24
		      if (feature._source.equipage_accur > 24) {
		        this.addCircleEquipage(feature, delta);
		      }
		      this.addMarkerEquipage(feature, delta);
		    }
};

/**
 * permet d'ajouter un marker sur la map a partir d'une feature
 *
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de l'equipage
 */
Map.prototype.addMarkerEquipage = function(feature, delta) {
	var doc_id = feature._id;
	var equipage_id = feature._source.equipage_id;
  var x = feature._source.equipage_x;
  var y = feature._source.equipage_y;
  var equipage_type = feature._source.equipage_type;
  var point = new ol.geom.Point([x, y]);
  var feat = new ol.Feature({geometry: point});
  // code couleur : bleu recent, gris ancien
	if (delta > 5 * MINUTE_IN_MILLIS) {
		feat.set('color', 'grey');
	} else {
		feat.set('color', 'blue');
	}
  feat.set('equipage_id', equipage_id);
  feat.set('type', equipage_type);
	feat.set('doc_id', doc_id);
  feat.setStyle(markerStyleEquipage);
  vectorSource.addFeature(feat);
};


/**
 * Permet d'ajouter un cercle d'incertitude sur la map a partir d'une feature d'un equipage
 *
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de la feature
 */
Map.prototype.addCircleEquipage = function(feature, delta) {
	var doc_id = feature._id;
  var equipage_id = feature._source.equipage_id;
  var radius = feature._source.equipage_accur;
  var x = feature._source.equipage_x;
  var y = feature._source.equipage_y;
  var circle = new ol.geom.Circle([x, y], radius);
  var feat = new ol.Feature({geometry: circle});

	if (delta > 5 * MINUTE_IN_MILLIS) {
		feat.set('color', 'grey');
	} else {
		feat.set('color', 'blue');
	}
	feat.set('doc_id', doc_id);
  feat.setStyle(circleStyle);
  vectorSource.addFeature(feat);
};

/**
 * Recentre la carte sur le point donné en argument
 * @param center
 */
Map.prototype.centerMap = function(center) {
  map.getView().animate({'center': center, duration: 750});
};

/**
 * Recentre la carte sur le point donné en argument avec le zoom
 * @param center
 */
Map.prototype.centerMapWithZoom = function(center) {
  map.getView().animate({'center': center, zoom: 11, duration: 750});
};
