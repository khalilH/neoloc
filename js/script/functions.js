  // Initialisation de la map, des boutons (center + menu)
  // + Gestion des events (singleclick et moveend)
  function initMap() {
    proj4.defs("EPSG:2154", LAMBERT93);

    // Debut d'initialisation de l'objet map
    var EPSG_2154 = new ol.proj.Projection({
      code: 'EPSG:2154',
      extent: [503514.6000000015, 6683176.3999999985, 849432.8, 6997025],
      units: 'm'
    });

    // import de la projection de lambert93 dans openlayers
    ol.proj.addProjection(EPSG_2154);

    var tileg = new ol.tilegrid.TileGrid({
      origin: [-3.55975*_E7, 4.89531*_E7],
      resolutions: RESOLUTIONS,
      tileSize: 512
    });

    var point = proj4('EPSG:4326', LAMBERT93, [2.362765, 48.841291]);

    vectorSource = new ol.source.Vector({});

    var freepik = new ol.Attribution({
      html: '<div>Icons made by <a href="http://www.freepik.com" title="Freepik">Freepik</a>'+
      ' from <a href="http://www.flaticon.com" title="Flaticon">www.flaticon.com</a>'+
      ' is licensed by <a href="http://creativecommons.org/licenses/by/3.0/"'+
      ' title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>'
    });

    var plainicon = new ol.Attribution({
      html: '<div>Icons made by <a href="http://www.flaticon.com/authors/plainicon"'+
      ' title="Plainicon">Plainicon</a> from <a href="http://www.flaticon.com"'+
      ' title="Flaticon">www.flaticon.com</a> is licensed by '+
      '<a href="http://creativecommons.org/licenses/by/3.0/"'+
      ' title="Creative Commons BY 3.0" target="_blank">CC 3.0 BY</a></div>'
    });

    // Ajout des boutons personalises (centerMap + toggleMenu)
    app.RecenterMap = function(opt_options) {
      var options = opt_options || {};
      var button = document.createElement('button');
      button.innerHTML = '<span class="glyphicon glyphicon-screenshot" aria-hidden="true"></span>';

      var this_ = this;
      var handleRecenterMap = function() {
        recenterMap();
      };
      button.addEventListener('click', handleRecenterMap, false);

      var element = document.createElement('div');
      element.className = 'centerButton ol-unselectable ol-control';
      element.appendChild(button);

      ol.control.Control.call(this, {
        element: element,
        target: options.target
      });

    };
    app.ToggleMenu = function(opt_options) {
      var options = opt_options || {};
      var button = document.createElement('button');
      button.innerHTML = '<span class="glyphicon glyphicon-menu-hamburger" aria-hidden="true"></span>';

      var this_ = this;
      var handleToggleMenu = function() {
        toggleMenu();
      };
      button.addEventListener('click', handleToggleMenu, false);

      var element = document.createElement('div');
      element.className = 'toggle ol-unselectable ol-control';
      element.appendChild(button);

      ol.control.Control.call(this, {
        element: element,
        target: options.target
      });

    };
    ol.inherits(app.RecenterMap, ol.control.Control);
    ol.inherits(app.ToggleMenu, ol.control.Control);

    map = new ol.Map({
      controls: ol.control.defaults({
      }).extend([
        new app.RecenterMap(),
        new app.ToggleMenu()
      ]),
      target: 'map',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.XYZ({
            attributions : [freepik, plainicon],
            tileUrlFunction: function(tileCoord, pixelRatio, projection) {
              var z = tileCoord[0];
              var x = tileCoord[1];
              var y = -tileCoord[2] - 1;
              return URL_TEMPLATE.replace('{z}', z.toString())
              .replace('{y}', y.toString())
              .replace('{x}', x.toString());
            },
            projection: EPSG_2154,
            tileGrid: tileg,
          })
        }),
        new ol.layer.Vector({
          source: vectorSource
        })
      ],
      view: new ol.View({
        center: point,
        projection: EPSG_2154,
        maxZoom:15,
        minZoom:2,
        zoom: 10
      })
    });
    // Fin d'initialisation de l'objet map

    // Gestion de l'evenement lorsque la vue de la carte change
    map.on('moveend', function(event) {
      if (!allowXHR) {allowXHR = true;}
      getFeaturesInMapExtent();
    });

    // Suppression de la class disabled (reste present apres un F5)
    $('#goButton').removeAttr('disabled');
    initDateTimePicker();
    setInterval(getFeaturesInMapExtent, REFRESH_TIME);
  }
  
  
  /**
   * Lancement de l'application en mode user
   */
  function startUserMode() {
    if (navigator.geolocation) {
      openNotification("Géolocalisation en cours, cliquez sur la carte pour indiquer votre position");
      var point;
      
      //recuperer le filtre de recherche
      var searchParams = ofeature.getFeatureParams(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, id);
      
      var onSuccess = function(response, error){
          if (error != undefined) {
              console.error(error);
            } else if (response.hits.total == 0) {
              console.log(id+' non present dans la base');
            } else {
              var feature = response.hits.hits[0];
              objectId = feature._id;
              console.log(objectId);
              point = [feature._source.neo_x, feature._source.neo_y];
              neo_type = feature._source.neo_type;
              refreshInputRadio(neo_type);
              sessionStorage.lastPosition = JSON.stringify(point);
              centerMap(point);
            }

            // Gestion du click simple sur la carte pour l'initialisation manuelle
            // de sa position en attente du fix GPS
            var mapDiv = document.getElementById('map');
            var mousedown_x, mousedown_y, mouseup_x, mouseup_y;

            mapDiv.addEventListener('mousedown', function(event) {
              console.log(event);
              mousedown_x = event.layerX;
              mousedown_y = event.layerY;
            });

            mapDiv.addEventListener('mouseup', function(event) {
              mouseup_x = event.layerX;
              mouseup_y = event.layerY;

              if (mousedown_x == mouseup_x && mousedown_y == mouseup_y) {
                if(!isGPSReady) {
                  var coordinates = map.getCoordinateFromPixel([mouseup_x, mouseup_y]);
                  var mapPoint = {'x': coordinates[0], 'y': coordinates[1]};
                  console.log(mapPoint);
                  refreshId();
                  if (objectId == null) {
                    //addFeature(5, 0, 0, mapPoint);
                	 ofeature.add(id, type, NEOCONFIG.es.index, NEOCONFIG.es.type.neo, 5, 0, 0, mapPoint);
                  } else {
                	ofeature.update(id, type, objectId, NEOCONFIG.es.index, NEOCONFIG.es.type.neo, 5, 0, 0, mapPoint);
                    lastDateUpdate = Date.now();
                  }
                  updateLocalFeatureGeometry(mapPoint.x, mapPoint.y);
                  sessionStorage.lastPosition = JSON.stringify(coordinates);
                }
              }
            })
            getLocation();              	  
      };//fin onSuccess
      
  	  //checher/executer 
	  es.searchExec(searchParams, onSuccess, null);
    }else{
      showError("Géolocalisation non supportée");
    }
  }  
  
  
  /**
   * Permet de recuperer et afficher uniquement les features qui seront visibles sur la carte
   */
  function getFeaturesInMapExtent() {
	  
    if (Date.now() - lastDateQuery > 5 * SECOND_IN_MILLIS || allowXHR) {
      //recuperer le filtre de recherche
      var searchParams = ofeature.getFeaturesInMapExtentSearchParams(NEOCONFIG.es.index);
  	  /**
  	   * callback succes
  	   * @param response //reponse d'ElasticSearch
  	   */
      var onSuccess = function(response){
	    if(response.hits.hits){
	    	  //rafraichir la carte
  	          ofeature.refreshFeatures(response.hits.hits);
  	          //noter la date de la query
  	          lastDateQuery = Date.now();
  	          if (allowXHR) {
  	            allowXHR = false;
  	          }
  	      }  		  
  	  };
  	  //checher/executer 
	  es.searchExec(searchParams, onSuccess, null);

    }else{
    	  console.log('TOO SOON - getFeaturesInMapExtent');    	  
    }	  
  }  
  
  
  