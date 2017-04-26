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
    if (features[i].get('doc_id') == ouser.ESid) {
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
	feat.set('doc_id', ouser.ESid);
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
	var doc_id = feature._id;
	var neo_id = feature._source.neo_id;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var neo_type = feature._source.neo_type;
  var point = new ol.geom.Point([x, y]);
  var feat = new ol.Feature({geometry: point});
  if (doc_id == ouser.ESid) {
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
Map.prototype.addCircle = function(feature, delta) {
	var doc_id = feature._id;
  var neo_id = feature._source.neo_id;
  var radius = feature._source.neo_accur;
  var x = feature._source.neo_x;
  var y = feature._source.neo_y;
  var circle = new ol.geom.Circle([x, y], radius);
  var feat = new ol.Feature({geometry: circle});
  if (doc_id == ouser.ESid) {
    feat.set('color', 'red');
  } else {
    if (delta > 5 * MINUTE_IN_MILLIS) {
      feat.set('color', 'blue');
    } else {
      feat.set('color', 'green');
    }
  }
	feat.set('doc_id', doc_id);
  feat.setStyle(circleStyle);
  vectorSource.addFeature(feat);
};

/**
 * Methode appelée pour recentrer la carte sur la derniere position connue
 * */
Map.prototype.recenterMap = function() {
	  var lastPosition = JSON.parse(sessionStorage.lastPosition); // [x,y] en lambert93
	  this.centerMap(lastPosition);
};


Map.prototype.recenterMapWithZoom = function() {
	var lastPosition = JSON.parse(sessionStorage.lastPosition); // [x,y] en lambert93
	this.centerMapWithZoom(lastPosition);
}

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


// Initialisation du service de geolocalisation
Map.prototype.initLocation = function() {
	initSelf = this;
    watchID = navigator.geolocation.watchPosition(
    function(position) {
      if (!isGPSReady) {
        isGPSReady = true;
        // desactive le clic sur la carte pour indiquer manuellement sa position
        closeNotification();
      }
      initSelf.updatePosition(position.coords);

    },
    function(error) {
      closeNotification();
      showError(error.message);
    },
    {maximumAge: 5000, enableHighAccuracy: true}
  );

};


// Met a jour la position dans l'index ES si et seulement si la derniere
// mise a jour n'a pas eu lieu dans les 5 dernieres secondes
Map.prototype.updatePosition = function(coords) {
  var lat = coords.latitude, lng = coords.longitude, accuracy = coords.accuracy,
  alt = coords.altitude, heading = coords.heading, speed = coords.speed;
  // speed est en mph
  showNotification(lat+", "+lng+" - "+accuracy+"m"); // a supprimer
  if (Date.now() - lastDateUpdate > 5 * SECOND_IN_MILLIS)  {
    addFeature_wgs84(lat, lng, accuracy, heading, mphTokmph(speed));
    lastDateUpdate = Date.now();
  } else {
    console.log("too soon");
  }
};
