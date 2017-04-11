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

    var neoversion = new ol.Attribution({
        html: '<div class="attribution_perso">NEOLOC Version '+NEOCONFIG.neoversion+'</div>'
      });

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
        omap.recenterMap();

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
            attributions : [neoversion, freepik, plainicon],
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
              //console.log(ouser.ESid);
              ouser.x = feature._source.neo_x;
              ouser.y = feature._source.neo_y;
              ouser.type = feature._source.neo_type;
              refreshInputRadio(ouser.type);
              sessionStorage.lastPosition = JSON.stringify(ouser.getPoint());
              omap.centerMap(ouser.getPoint());
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
            omap.initLocation();
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


  // permet de mettre a jour le type, l'idRadio
  function refreshId() {
    var idRadio = form.idRadio.value;
    var _type = form.type.value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      ouserSeek.id = idRadio;
      ouserSeek.type = _type;
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
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      ouser.clean();
      ouser.id = idRadio;
      ouser.type = _type;
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
