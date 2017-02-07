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
Map.prototype.refreshPositions = function (hits){

		    refreshId();
		    var i, length = hits.length;
		    if (length == 0) return;
		    console.log('refresh');
		    vectorSource.clear();
		    for (i = 0; i < length ; i++) {
		      var feature = hits[i];
		      var timestamp = feature._source.neo_timestamp;
		      var delta = Date.now() - timestamp;
		      //si delai de 6 heures, on ignore le point
		      if (delta > 60*6 * MINUTE_IN_MILLIS) {
		        continue;
		      }
		      //si la précision est superieure à 24
		      if (feature._source.neo_accur > 24) {
		        this.addCircle(feature, delta);
		      }
		      this.addMarker(feature, delta);
		    }
};

/**
 * Permet de mettre a jour localement la position et le type de ma feature
 * @param x
 * @param y
 */
Map.prototype.updateLocalFeatureGeometry = function(x, y) {
  var features = vectorSource.getFeatures();
  var length = features.length;
  for (var i = 0; i < length; i++) {
    if (features[i].get('neo_id') == ouser.id) {
      refreshId();
      features[i].setGeometry(new ol.geom.Point([x, y]));
      features[i].set('type', ouser.type);
      vectorSource.refresh();
      return;
    }
  }
  var point = new ol.geom.Point([x, y]);
  var feat = new ol.Feature({geometry: point});
  feat.set('color', 'red');
  feat.set('neo_id', ouser.id);
  feat.set('type', ouser.type);
  feat.setStyle(markerStyle);
  vectorSource.addFeature(feat);
  vectorSource.refresh();
};


/**
 * permet d'ajouter un marker sur la map a partir d'une feature
 * 
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de la feature
 */
Map.prototype.addMarker = function(feature, delta) {
  var neo_id = feature._source.neo_id;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var neo_type = feature._source.neo_type;
  var point = new ol.geom.Point([x, y]);
  var feat = new ol.Feature({geometry: point});
  if (neo_id == ouser.id) {
    feat.set('color', 'red');
  } else {
    if (delta > 5 * MINUTE_IN_MILLIS) {
      feat.set('color', 'blue');
    } else {
      feat.set('color', 'green');
    }
  }
  feat.set('neo_id', neo_id);
  feat.set('type', neo_type);
  feat.setStyle(markerStyle);
  vectorSource.addFeature(feat);
};


/**
 * Permet d'ajouter un cercle d'incertitude sur la map a partir d'une feature
 * 
 * @param feature
 * @param delta  //temps depuis la derniere mise a jour de la feature
 */
Map.prototype.addCircle = function(feature, delta) {
  var neo_id = feature._source.neo_id;
  var radius = feature._source.neo_accur;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var circle = new ol.geom.Circle([x, y], radius);
  var feat = new ol.Feature({geometry: circle});
  if (neo_id == ouser.id) {
    feat.set('color', 'red');
  } else {
    if (delta > 5 * MINUTE_IN_MILLIS) {
      feat.set('color', 'blue');
    } else {
      feat.set('color', 'green');
    }
  }
  feat.setStyle(circleStyle);
  vectorSource.addFeature(feat);
};