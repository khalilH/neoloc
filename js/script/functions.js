  // Initialisation de la map, des boutons (center + menu)
  // + Gestion des events (singleclick et moveend)

  var tracking = true;
  var updateEquipageLocation = false;
  const INDICATIF_RADIO = "INDICATIF_RADIO";
  const EQUIPAGE_ES_ID = "EQUIPAGE_ES_ID";
  const EQUIPAGE_DATE = "EQUIPAGE_DATE";
  const CHEF_DE_BORD = "CHEF_DE_BORD";
  const COMPOSITION = "COMPOSITION";
  const FEMME = "FEMME";
  const HORS_POLICE = "HORS_POLICE"
  const ADS = "ADS"

  window.addEventListener("load", function() {

    // Recuperation des champs de saisies memorises ----> DEBUT
    equipageForm = document.getElementById('equipageForm');
    var tmp = localStorage.getItem(INDICATIF_RADIO);
    if (tmp != null) {
      document.getElementById("indicatifRadioInput").value = tmp;
      console.log(tmp+" recupere dans le localStorage");
    }

    tmp = localStorage.getItem(CHEF_DE_BORD);
    if (tmp != null) {
      if (tmp == "false") {
        equipageForm.chefDeBord.checked = false;
      }
      else {
        equipageForm.chefDeBord.checked = true;
      }
      console.log("chef de bord = "+tmp);
    }

    tmp = localStorage.getItem(FEMME);
    if (tmp != null) {
      if (tmp == "false") {
        equipageForm.presenceFemme.checked = false;
      }
      else {
        equipageForm.presenceFemme.checked = true;
      }
      console.log("presenceFemme = "+tmp);
    }

    tmp = localStorage.getItem(HORS_POLICE);
    if (tmp != null) {
      if (tmp == "false") {
        equipageForm.presenceHorsPolice.checked = false;
      }
      else {
        equipageForm.presenceHorsPolice.checked = true;
      }
      console.log("hors police = "+tmp);
    }

    tmp = localStorage.getItem(ADS);
    if (tmp != null) {
      if (tmp == "false") {
        equipageForm.presenceADS.checked = false;
      }
      else {
        equipageForm.presenceADS.checked = true;
      }
      console.log("ADS = "+tmp);
    }

    tmp = localStorage.getItem(COMPOSITION);
    if (tmp != null) {
      equipageForm.compositionEquipage.value = tmp;
      console.log("compositionEquipage = "+tmp);
    }
    // Recuperation des champs de saisie TERMINEE <----

    // Bouton de mise a jour de l'equipage
    var validerModifsBtn = document.getElementById("validerModifsBtn");
    validerModifsBtn.addEventListener('click', function() {
      if (equipageForm.chefDeBord.checked) {
        updateEquipageLocation = true;
      } else {
        updateEquipageLocation = false;
      }
      refreshEquipage(equipageForm);
    });

    // Controle de la saisie de l'indicatif radio
    var indicatifRadioInput = document.getElementById('indicatifRadioInput');
    indicatifRadioInput.addEventListener('keyup', function(event) {
      var regexp = /[a-zA-Z0-9]/;
      if(!regexp.test(event.key)) {
        var length = indicatifRadioInput.value.length;
          indicatifRadioInput.value = indicatifRadioInput.value.slice(0, length-1);
      }
    });

    // // Orientation auto de la map avec DeviceOrientationEvent
    // if (window.DeviceOrientationEvent) {
    //   window.addEventListener('deviceorientation', deviceOrientationHandler, false);
    //   showNotification("DeviceOrientation available", "idInfo")
    // }
    //
    // function deviceOrientationHandler(eventData) {
    //   if (tracking) {
    //     // map.getView().setRotation(degreeToRad(Math.trunc(eventData.alpha)))
    //   }
    // }

  });

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

    // Ajout des boutons personalises (toggleMenu + autoCenter)

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

    app.AutoCenter = function(opt_options) {
      var options = opt_options || {};
      var button = document.createElement('button');
      button.innerHTML = '<span class="glyphicon glyphicon-map-marker" aria-hidden="true"></span>';

      var this_ = this;
      var handleAutoCenter = function() {
          // remettre tracking a true et cacher le bouton d'autoCenter
          tracking = true;
          document.getElementById('autoCenterDiv').style.display = "none";
          omap.recenterMapWithZoom();
          // tester le comportement si la carte se recentre directement ?
      };
      button.addEventListener('click', handleAutoCenter, false);

      var element = document.createElement('div');
      element.className = 'autoCenter ol-unselectable ol-control';
      element.setAttribute("id", "autoCenterDiv")
      element.appendChild(button);

      ol.control.Control.call(this, {
        element: element,
        target: options.target
      });

    };

    ol.inherits(app.ToggleMenu, ol.control.Control);
    ol.inherits(app.AutoCenter, ol.control.Control);

    map = new ol.Map({
      controls: ol.control.defaults({
      }).extend([
        new app.ToggleMenu(),
        new app.AutoCenter()
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
      // getFeaturesInMapExtent();
    });

    // Modification pour le tracking automatique en cas de deplacement de la carte
    map.on('pointerdrag', function(event) {
      // mettre tracking a false et afficher le bouton
      tracking = false;
      document.getElementById('autoCenterDiv').style.display = "block";
    });


    // Suppression de la class disabled (reste present apres un F5)
    $('#goButton').removeAttr('disabled');
    equipageForm.chefDeBord.removeAttribute('disabled');
    // setInterval(getFeaturesInMapExtent, REFRESH_TIME);
  }

  // Permet d'ajouter les evenement qui permettent d'indiquer manuellement sa position
  function addMapEvents() {
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
          omap.centerMap(ouser.getPoint());
          sessionStorage.lastPosition = JSON.stringify(coordinates);
        }
      }
    });
  }

  /**
   * Lancement de l'application en mode user
   */
  function startUserMode() {
    if (navigator.geolocation) {
      openNotification("Géolocalisation en cours, cliquez sur la carte pour indiquer votre position");

      //Recuperer _id de mon document de type neo
      var _id = localStorage.getItem(ES_ID);
      if (_id != null) {
        // J'ai peut etre un document qui existe ES
        console.log("J'ai peut etre un document qui existe ES");
        var getParams = ofeature.getFeatureParams(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, _id);

        var onSuccess = function (response, error) {
          if (error != undefined) {
            console.error(error);
            localStorage.removeItem(ES_ID);
          } else if (!response.found) {
            console.log("le document "+_id+" n'existe pas");
            localStorage.removeItem(ES_ID);
          } else {
            console.log("Le document "+_id+" existe");
            console.log(response);
            ouser.ESid = response._id;
            ouser.x = response._source.neo_x;
            ouser.y = response._source.neo_y;
            ouser.type = response._source.neo_type;
            ouser.accuracy = response._source.neo_accur;
            refreshInputRadio(ouser.type);
            sessionStorage.lastPosition = JSON.stringify(ouser.getPoint());
            omap.updateLocalFeatureGeometry(ouser.x, ouser.y);
            omap.centerMapWithZoom(ouser.getPoint());
          }
          addMapEvents();
          omap.initLocation();
        }

        oes.getExec(getParams, onSuccess, null);
      } else {
        // Je n'ai pas de document qui existe dans ES
        console.log("Je n'ai pas de document qui existe dans ES");
        addMapEvents();
        omap.initLocation();
      }
    } else{
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

    } else {
    	  console.log('TOO SOON - getFeaturesInMapExtent');
    }
  }


  // permet de mettre a jour le type, l'idRadio
  function refreshId() {
    var idRadio = form.idRadio.value;
    var tmp = idRadio.toUpperCase();
    idRadio = tmp.replace(/\s/g,'');
    form.idRadio.value = idRadio;
    var _type = form.type.value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      // ouserSeek.id = idRadio;
      // ouserSeek.type = _type;
      ouser.id = idRadio;
      ouser.type = _type;

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

  // Permet de mettre a jour dynamiquement un equipage
  function refreshEquipage(form) {
    if (form.chefDeBord.checked) {
      // oequipage.id = ouser.id;
      if (oequipage.id == undefined) {
        oequipage.id = ouser.id;
      }
      if (oequipage.date_creation == undefined) {
        oequipage.date_creation = Date.now();
      }
      oequipage.composition = form.compositionEquipage.value;
      oequipage.femme = form.presenceFemme.checked;
      oequipage.hors_police = form.presenceHorsPolice.checked;
      oequipage.ads = form.presenceADS.checked;
      oequipage.equipements = [];
      if (form.equipementAssaut.checked) {
        oequipage.equipements.push(form.equipementAssaut.value);
      }
      if (form.grenades.checked) {
        oequipage.equipements.push(form.grenades.value);
      }
      if (form.taser.checked) {
        oequipage.equipements.push(form.taser.value);
      }
      if (form.lbd.checked) {
        oequipage.equipements.push(form.lbd.value);
      }
      if (form.pm.checked) {
        oequipage.equipements.push(form.pm.value);
      }
      if (form.equipementMO.checked) {
        oequipage.equipements.push(form.equipementMO.value);
      }
      showNotification("Mise a jour de votre équipage", "equipageSuccess");
      oequipageManager.save(NEOCONFIG.es.index, oequipage);
    } else {
      showNotification("Vous n'etes pas chef de bord", "equipageError");
    }
  }


  // Permet de creer un equipage avec une date_creation egale a Date.now()
  function createEquipage(form, indicatif, _id) {
    // Remplissage de l'objet Equipage
    if (_id != undefined) {
      oequipage.ESid = _id;
    }
    oequipage.id = indicatif;
    oequipage.composition = form.compositionEquipage.value;
    oequipage.femme = form.presenceFemme.checked;
    oequipage.hors_police = form.presenceHorsPolice.checked;
    oequipage.date_creation = Date.now();
    if (form.equipementAssaut.checked) {
        oequipage.equipements.push(form.equipementAssaut.value);
    }
    if (form.grenades.checked) {
        oequipage.equipements.push(form.grenades.value);
    }
    if (form.taser.checked) {
        oequipage.equipements.push(form.taser.value);
    }
    if (form.lbd.checked) {
        oequipage.equipements.push(form.lbd.value);
    }
    // Fin du remplissage de l'objet equipage
    oequipageManager.save(NEOCONFIG.es.index, oequipage);
  }

  // Permet de desactiver le bouton de lancement
  function disableGoButton() {
    $('#goButton').attr('disabled', 'disabled');
    $('#goButton').addClass('disabled');
    $('#goButton').removeClass('btn-info');
    $('#goButton').addClass('btn-danger');
  }

  // Saisie de l'identifiant Radio + lancement de du service de geolocalisation
  function login() {
    var idRadio = form.idRadio.value;
    var _type = form.type.value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      console.log('before '+idRadio);
      var tmp = idRadio.toUpperCase();
      idRadio = tmp.replace(/\s/g,'');
      form.idRadio.value = idRadio;
      console.log('after '+idRadio);
      memoriserSaisies();
      ouser.clean();
      ouser.id = idRadio;
      ouser.type = _type;

      // Traitement si la case chef de bord est coche
      if (equipageForm.chefDeBord.checked) {

        updateEquipageLocation = true;
        // Recherche de l'existance d'un equipage avec le meme indicatif radio
        var searchParams = oequipageManager.getEquipageParams(NEOCONFIG.es.index, idRadio);

        var onSuccess = function(response, error) {
          if (error != undefined) {
            console.error(error);
          } else if (response.hits.total == 0) {
            // Equipage non present dans ES, creation possible
            console.log("Creation d'equipage possible equipage "+idRadio+" non present dans elasticsearch");
            createEquipage(equipageForm, idRadio);
            document.getElementById("validerModifsBtn").style.display = 'inline';
            disableGoButton();
            startUserMode();
          } else {
            var equipageResult = response.hits.hits[0];
            oequipage.ESid = equipageResult._id;
            oequipage.id = equipageResult._source.equipage_id;
            oequipage.composition = equipageResult._source.equipage_composition;
            oequipage.femme = equipageResult._source.equipage_femme;
            oequipage.hors_Police = equipageResult._source.equipage_hors_police;
            oequipage.equipements = equipageResult._source.equipage_equipements;
            oequipage.date_creation = equipageResult._source.equipage_date_creation;
            if (Date.now() - oequipage.date_creation < 6 * HOUR_IN_MILLIS) {
              showNotification("Mise a jour possible de l'equipage", "equipageInfo");
            } else {
              console.log("Creation d'equipage possible")
              createEquipage(equipageForm, idRadio, oequipage.ESid); // mise a jour date de creation
            }
            document.getElementById("validerModifsBtn").style.display = 'inline';
            disableGoButton();
            startUserMode();
          }
        }

        oes.searchExec(searchParams, onSuccess, null);

      } else {
        var searchParams = oequipageManager.getEquipageParams(NEOCONFIG.es.index, idRadio);

        var onSuccess = function(response, error) {
          if (error != undefined) {
            console.error(error);
          } else if (response.hits.total == 0) {
            // Equipage non present dans ES, lancement geoloc comme dans la version 1.0
            console.log("Chef de bord non coche,Equipage non present dans ES, lancement geoloc");
            document.getElementById("validerModifsBtn").style.display = 'inline';
            disableGoButton();
            startUserMode();
          } else {
            var equipageResult = response.hits.hits[0];
            oequipage.ESid = equipageResult._id;
            oequipage.id = equipageResult._source.equipage_id;
            oequipage.composition = equipageResult._source.equipage_composition;
            oequipage.femme = equipageResult._source.equipage_femme;
            oequipage.hors_Police = equipageResult._source.equipage_hors_police;
            oequipage.equipements = equipageResult._source.equipage_equipements;
            oequipage.date_creation = equipageResult._source.equipage_date_creation;
            showNotification("Vous rejoignez un équipage", "equipageInfo");
            console.log("Chef de bord non coche -> je rejoins l'equipage "+oequipage.id);
            document.getElementById("validerModifsBtn").style.display = 'inline';
            disableGoButton();
            startUserMode();
          }
        }

        oes.searchExec(searchParams, onSuccess, null);
      }

      // Lancement de la geoloc sans les equipage
      // startUserMode();
    } else {
      showError('Identifiant radio non indiqué', 'idError');
    }
  }

  // Permet de memoriser les saisies dans le localStorage a chaque click du bouton 'GO'
  function memoriserSaisies() {
    localStorage.setItem(INDICATIF_RADIO, form.idRadio.value);
    localStorage.setItem(CHEF_DE_BORD, equipageForm.chefDeBord.checked);
    localStorage.setItem(COMPOSITION, equipageForm.compositionEquipage.value);
    localStorage.setItem(FEMME, equipageForm.presenceFemme.checked);
    localStorage.setItem(HORS_POLICE, equipageForm.presenceHorsPolice.checked);
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
    // debut modif tracking automatique
    if (tracking) {
      omap.recenterMap();
    }
    // fin modif tracking automatique
    var mapPoint_2154 = {'x': tmp[0], 'y': tmp[1]};
    ouser.x = mapPoint_2154.x;
    ouser.y = mapPoint_2154.y;
    ouser.accuracy = accuracy;
    ouser.heading = heading;
    ouser.speed = speed;
    refreshId();
    ofeature.save(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, ouser);
    omap.updateLocalFeatureGeometry(ouser.x, ouser.y);
    omap.centerMap(ouser.getPoint());
  }



  /****
   *
   *
   * 	OUTILS
   *
   */


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

  function degreeToRad(angle) {
    return Math.PI * angle / 180;
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
