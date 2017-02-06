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
  
  
  
  // Permet de recuperer uniquement les features qui seront visibles sur la carte
  function getFeaturesInMapExtent() {
	  
    if (Date.now() - lastDateQuery > 5 * SECOND_IN_MILLIS || allowXHR) {

      var searchParams = ofeature.getFeaturesInMapExtentSearchParams(NEOCONFIG.es.index);
  	  var onSuccess = function(features){
  		  console.log("sucsscess");
  		console.log(features);
	    if(features){
  	          refresh(features);
  	          lastDateQuery = Date.now();
  	          if (allowXHR) {
  	            allowXHR = false;
  	          }
  	      }  		  
  	  };
	  es.searchExec(searchParams, onSuccess, null);

    }else{
    	  console.log('TOO SOON - getFeaturesInMapExtent');    	  
    }	  
  }  