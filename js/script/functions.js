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
              return NEOCONFIG.mapServer.template.replace('{z}', z.toString())
              .replace('{y}', y.toString())
              .replace('{x}', x.toString());
            },
            projection: EPSG_2154,
            tileGrid: tileg
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
      var searchParams = ofeature.getFeatureParams(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, ouser.id);
      /**
       * onsuccess
       * initialiser l'utilisateur et ses interactions avec la carte
       */
      var onSuccess = function(response, error){
          if (error != undefined) {
              console.error(error);
            } else if (response.hits.total == 0) {
              console.log(ouser.id+' non present dans la base');
            } else {
              var feature = response.hits.hits[0];
              ouser.ESid = feature._id; 
              console.log(ouser.ESid);
              ouser.x = feature._source.neo_x;
              ouser.y = feature._source.neo_y;              
              ouser.type = feature._source.neo_type;
              refreshInputRadio(ouser.type);
              sessionStorage.lastPosition = JSON.stringify(ouser.getPoint());
              centerMap(ouser.getPoint());
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
                  ouser.x = coordinates[0];
                  ouser.y = coordinates[1];
                  ouser.accuracy = 5;
                  ouser.heading = 0;
                  ouser.speed = 0;
                  console.log(ouser.getPoint());
                  refreshId();
                  ofeature.save(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, ouser);
                  if (ouser.ESid != null) {
                	  lastDateUpdate = Date.now();
                  }
                  omap.updateLocalFeatureGeometry(ouser.x, ouser.y);
                  sessionStorage.lastPosition = JSON.stringify(coordinates);
                }
              }
            });
            getLocation();              	  
      };//fin onSuccess
      
  	  //checher/executer 
	  oes.searchExec(searchParams, onSuccess, null);
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
      console.log(searchParams);
  	  /**
  	   * callback succes
  	   * @param response //reponse d'ElasticSearch
  	   */
      var onSuccess = function(response){
	    if(response.hits.hits){
	    	  //rafraichir la carte
  	          omap.refreshPositions(response.hits.hits);
  	          //noter la date de la query
  	          lastDateQuery = Date.now();
  	          if (allowXHR) {
  	            allowXHR = false;
  	          }
  	      }  		  
  	  };
  	  //checher/executer 
	  oes.searchExec(searchParams, onSuccess, null);

    }else{
    	  console.log('TOO SOON - getFeaturesInMapExtent');    	  
    }	  
  }  
  
  
  // permet de mettre a jour le type, l'idRadio ete la date/heure de fin de vacation
  function refreshId() {   
    var idRadio = form.idRadio.value;
    var _type = form.type.value;
    var _date = document.getElementById('finVacation').value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      ouser.id = idRadio; 
      ouser.type = _type; 
      if (_date != '') {
        var tmp = new Date(_date);
        ouser.dateFinVac = tmp.getTime();        
      } else {
    	ouser.dateFinVac = 0;
      }
    }
  }
  
  
  // Permet de mettre automatiquement a jour le type du vehicule sur le formulaire
  function refreshInputRadio(neo_type) {
    switch (neo_type) {
      case "bicycle":
      form.type[0].checked = true;
      break;
      case "bike":
      form.type[1].checked = true;
      break;
      case "car":
      form.type[2].checked = true;
      break;
      case "policeman":
      form.type[3].checked = true;
      break;
      default:
      console.error("je ne dois pas passer ici "+neo_type);
    }
  }
  
  // Saisie de l'identifiant Radio
  function login() {	
    var idRadio = form.idRadio.value;
    var _type = form.type.value;
    var _date = document.getElementById('finVacation').value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      ouser.clean();
      ouser.id = idRadio; 
      ouser.type = _type; 
      if (_date != '') {
        var tmp = new Date(_date);
        ouser.dateFinVac = tmp.getTime();        
      }
      else {
    	ouser.dateFinVac = 0;
      }
      $('#goButton').attr('disabled', 'disabled');
      $('#goButton').addClass('disabled');
      $('#goButton').removeClass('btn-info');
      $('#goButton').addClass('btn-danger');
      startUserMode();
    } else {
      showError('Identifiant radio non indiqué', 'idError');
    }
  }



  // Lancement de l'application en mode salle de commandement
  function startAdminMode() {

  }
  
  
  // Methode permettant d'afficher et de cacher le menu (seulement sur smartphone)
  function toggleMenu() {
    if (isMenuVisible) {
      document.getElementById('sidebar').style.display = 'none';
      document.getElementById('map').style.top = "0";
      map.updateSize();
      isMenuVisible = false;
    }
    else {
      document.getElementById('sidebar').style.display = 'block';
      document.getElementById('map').style.top = "35%";
      map.updateSize();
      isMenuVisible = true;
    }
  }

  // Methode appelée pour recentrer la carte sur la derniere position connue
  function recenterMap() {
    console.log("recenter");
    var lastPosition = JSON.parse(sessionStorage.lastPosition); // [x,y] en lambert93
    centerMap(lastPosition);
  }

  // Recentre la carte sur le point donné en argument
  function centerMap(center) {
    map.getView().animate({'center': center, zoom: 11, duration: 750});
  }

  // Initialisation du service de geolocalisation
  function getLocation() {
    watchID = navigator.geolocation.watchPosition(
      function(position) {
        if (!isGPSReady) {
          isGPSReady = true;
          // desactive le clic sur la carte pour indiquer manuellement sa position
          closeNotification();
        }
        updatePosition(position.coords);
      },
      function(error) {
        closeNotification();
        showError(error.message);
      },
      {maximumAge: 5000, enableHighAccuracy: true}
    );
  }

  // Met a jour la position dans l'index ES si et seulement si la derniere
  // mise a jour n'a pas eu lieu dans les 5 dernieres secondes
  function updatePosition(coords) {
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
  }

  // Utilise proj4js pour la conversion de la lat, lng vers la projection de lambert93
  // Sauvegarde de la dernière position dans sessionStorage
  // Envoi de la position au serveur (mise à jour ou création selon contexte)
  function addFeature_wgs84(lat, lng, accuracy, heading, speed) {
    var tmp = proj4('EPSG:4326', LAMBERT93, [lng, lat]);
    var lastPosition = JSON.stringify([tmp[0], tmp[1]]);
    sessionStorage.lastPosition = lastPosition;
    var mapPoint_2154 = {'x': tmp[0], 'y': tmp[1]};
    ouser.x = mapPoint_2154.x;
    ouser.y = mapPoint_2154.y;
    ouser.accuracy = accuracy;
    ouser.heading = heading;
    ouser.speed = speed;
    refreshId();
    ofeature.save(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, ouser);
  }

/*  
  // Permet de mettre a jour localement la position et le type de ma feature
  function updateLocalFeatureGeometry(x, y) {
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
  }
*/
  
  /****
   * 
   * 
   * 	OUTILS
   * 
   */
  
  // permet d'activer ou non le focus lorsque l'utilisateur veut rentrer une date
  function initDateTimePicker() {
    // code specifique au S5 (height > 640), attention en cas de changement de materiel
    if (screen.height > 640) {
      $('#datetimepicker1').datetimepicker({
        locale: 'fr',
        focusOnShow: false,
        showTodayButton: true,
        showClose: true,
        toolbarPlacement: 'top',
        format: 'MM/DD/YYYY HH:mm',
        minDate: new Date()
      });
    } else {
      $('#datetimepicker1').datetimepicker({
        locale: 'fr',
        showTodayButton: true,
        showClose: true,
        toolbarPlacement: 'top',
        format: 'MM/DD/YYYY HH:mm',
        minDate: new Date()
      });
    }
  }

  // Permet d'ouvrir ou de fermer le volet du menu dont l'id du div est name
  function toggle(name) {
    if ($('#'+name)[0].hidden) {
      $('#'+name).fadeIn(500);
      $('#'+name)[0].hidden = false;
    }
    else {
      $('#'+name).fadeOut(500);
      $('#'+name)[0].hidden = true;
    }
  }
  

  // Permet de recuperer la couleur de l'image .png a partir d'une couleur
  function getColor(color) {
    switch (color) {
      case 'red':
      return 'R';
      break;
      case 'blue':
      return 'B';
      break;
      case 'green':
      return 'G';
      break;
      default:
      console.error("getColor : je ne dois pas passer ici "+color);
    }
  }

  // Permet de recuperer un code couleur a partir d'une couleur('red'|'green'|'blue')
  function getColorRGB(color) {
    switch (color) {
      case 'red':
      return '#F00';
      break;
      case 'blue':
      return '#00F';
      break;
      case 'green':
      return '#2EC854';
      break;
      default:
      console.error("getColorRGB : je ne dois pas passer ici "+color);
    }
  }

  // Permet de recuperer une couleur rgba a partir d'une couleur
  function getColorRGBA(color) {
    switch (color) {
      case 'red':
      return 'rgba(255, 0, 0, 0.1)';
      break;
      case 'blue':
      return 'rgba(0, 0, 255, 0.1)';
      break;
      case 'green':
      return 'rgba(0, 255, 0, 0.1)';
      break;
      default:
      console.error("getColorRGBA : je ne dois pas passer ici "+color);
    }
  }

  // Fonction de sytle d'un cercle d'incertitude
  // Permet d'obtenir la bonne couleur d'un cercle d'incertitude
  function circleStyle() {
    return [
      new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: this.get('color'),
          width: 1
        }),
        fill: new ol.style.Fill({
          color: getColorRGBA(this.get('color'))
        })
      })
    ];
  }

  // Fonction de style d'un marker
  // Permet d'obtenir la bonne icone et couleur d'une feature
  function markerStyle() {
    var zoom = map.getView().getZoom();
    var color = this.get('color');
    var suffixe = getColor(color);
    var type = this.get('type');

    return [
      new ol.style.Style({
        text: new ol.style.Text({
          font: '14px Calibri',
          fill: new ol.style.Fill({ color: getColorRGB(color) }),
          offsetY: -15,
          stroke: new ol.style.Stroke({
            color: '#fff', width: 2
          }),
          text: zoom > 8 ? this.get('neo_id') : '' // revoir les param de zoom
        }),
        image: new ol.style.Icon(({
          src: zoom < 5 ? 'images/dot'+suffixe+'.png':
          zoom < 9 ? 'images/'+type+suffixe+'_16.png' :
          'images/'+type+suffixe+'.png'
        }))
      })
    ];
  }

/*  
  // Permet d'ajouter un cercle d'incertitude sur la map a partir d'une feature
  // delta : temps depuis la derniere mise a jour de la feature
  function addCircle(feature, delta) {
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
  }
*/

/*
  // permet d'ajouter un marker sur la map a partir d'une feature
  // delta : temps depuis la derniere mise a jour de la feature
  function addMarker(feature, delta) {
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
  }
*/

  function mphTokmph(speed) {
    return speed * 1.609344;
  }

  // MESSAGES DE NOTIFICATION ET D'ERREUR
  function showNotification(message, labelId) {
    if (labelId != undefined) {
      document.getElementById(labelId).innerHTML = message;
      $('#'+labelId).fadeIn(400).delay(1500).fadeOut(400);
    } else {
      document.getElementById('notification').innerHTML = message;
      $('#notification').fadeIn(400).delay(1500).fadeOut(400);
    }
  }

  function openNotification(message) {
    document.getElementById('notification').innerHTML = message;
    $('#notification').fadeIn(500);
  }

  function closeNotification() {
    $('#notification').fadeOut(200);
  }

  function showError(message, labelId) {
    if(labelId != undefined) {
      document.getElementById(labelId).innerHTML = message;
      $('#'+labelId).fadeIn(400).delay(1500).fadeOut(400);
    } else {
      document.getElementById('error').innerHTML = message;
      $('#error').fadeIn(400).delay(2000).fadeOut(400);
    }
  }

  function debugNotif() {
    document.getElementById('notification').innerHTML = 'geolocalisation en cours, cliquez sur la carte pour indiquer votre position';
    document.getElementById('error').innerHTML = 'Perte de connexion';
    $('#notification').fadeIn(500);
    $('#error').fadeIn(500);
  }

  // handler du clic sur le bouton creer un evenement
  function handleCreateEvent() {
    var form = document.getElementById('evenementForm');
    var titre = form.evtTitre.value;
    var description = form.evtDescription.value;
    if (titre != '') {
      addEvent(titre, description);
    } else {
      showError('Titre non indiqué', 'evtError');
    }
  }

  // ajout d'un evenement dans ES si cela est possible
  function addEvent(titre, description) {
    if (ouser.id == null) {
      showError('Connexion requise', 'idError');
      return;
    }

    if (sessionStorage.lastPosition != undefined || isGPSReady) {
      var docEvent = {};
      docEvent[_EVENT_TITRE] = titre;
      var pos = JSON.parse(sessionStorage.lastPosition);
      docEvent[_EVENT_X] = pos[0];
      docEvent[_EVENT_Y] = pos[1];
      docEvent[_EVENT_AUTHOR] = ouser.id;
      if (description != '') {
        docEvent[_EVENT_DESCRIPTION] = description;
      }
      client.index({
        index: INDEX,
        type: EVENT_TYPE,
        body: docEvent
      }, function (error, response) {
        if (error != undefined) {
          console.error(error);
        } else {
          console.log(response);
          showNotification('Évènement '+titre+' créé', 'evtSuccess');
          var form = document.getElementById('evenementForm');
          form.evtTitre.value = '';
          form.evtDescription.value = '';
        }
      });
    } else {
        showError('Cliquez sur la carte pour indiquer votre position', 'evtInfo');
    }
  }