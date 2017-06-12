// boolean pour le mode de representation
// par defaut on ne represente que les equipages
var showEquipage = true;

window.addEventListener("load", function() {
  console.log("Page chargee");
  addMapEvents();
});

// Initialise la carte et ses boutons
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

  // Ajout des boutons personalises (toggleMenu + changeDisplay)

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

  app.changeDisplay = function(opt_options) {
    var options = opt_options || {};
    var button = document.createElement('button');
    button.innerHTML = '<span class="toz-on">on</span><span class="toz-off" style="display:none;">off</span>';

    var this_ = this;
    var handleChangeDisplay = function() {
      changeDisplay();
    };
    button.addEventListener('click', handleChangeDisplay, false);

    var element = document.createElement('div');
    element.className = 'change-display ol-unselectable ol-control';
    element.setAttribute("id", "changeDisplayButton")
    element.appendChild(button);

    ol.control.Control.call(this, {
      element: element,
      target: options.target
    });

  };

  ol.inherits(app.ToggleMenu, ol.control.Control);
  ol.inherits(app.changeDisplay, ol.control.Control);

  map = new ol.Map({
    controls: ol.control.defaults({
    }).extend([
      new app.ToggleMenu(),
      new app.changeDisplay()
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

  setInterval(getFeaturesInMapExtent, REFRESH_TIME);
}

function search() {
  alert('Pas encore implementee');
}

function showNeoInfos(neo) {
  var infosFillDiv = document.getElementById('displayInfo');
  var date = new Date(neo.neo_timestamp);
  infosFillDiv.innerHTML += "Timestamp: "+date.toLocaleTimeString()+"<br>";
}

function showEquipageInfos(equipage) {
  var oem = oequipageManager;
  var date = new Date(equipage[oem._EQUIPAGE_TIMESTAMP]);
  var equipements = equipage[oem._EQUIPAGE_EQUIPEMENTS];
  var indicatif = equipage[oem._EQUIPAGE_ID];
  var ads = equipage[oem._EQUIPAGE_ADS];
  var femme = equipage[oem._EQUIPAGE_FEMME];
  var horsPolice = equipage[oem._EQUIPAGE_HORS_POLICE];
  var dateCreation = equipage[oem._EQUIPAGE_DATE_CREATION];
  var composition = equipage[oem._EQUIPAGE_COMPOSITION];
  var infosFillDiv = document.getElementById('displayInfo');
  var presence = "";
  infosFillDiv.innerHTML += "Indicatif: "+indicatif+"<br>";
  infosFillDiv.innerHTML += "Timestamp: "+date.toLocaleTimeString()+"<br>";
  infosFillDiv.innerHTML += "Composition: "+composition+"<br>";
  if (ads) { presence += "ADS, "}
  if (femme) { presence += "femme, "}
  if (horsPolice) { presence += "hors-police, "}
  if (presence.length > 0) {
    presence = presence.slice(0,-2);
    infosFillDiv.innerHTML += "Présence: "+presence+"<br>";
  }
  if (equipements.length > 0) {
    infosFillDiv.innerHTML += "Equipement disponible:<br>";
    for (var i = 0; i < equipements.length; i++) {
      infosFillDiv.innerHTML += "<span style='padding-left:20px;'>"+equipements[i]+"</span><br>";
    }
  } else {
    infosFillDiv.innerHTML += "Pas d'équipement";
  }
}

// Permet d'ajouter les evenement qui permettent de cliquer sur une feature
function addMapEvents() {
  // Gestion du click simple sur la carte pour l'initialisation manuelle
  // de sa position en attente du fix GPS
  var mapDiv = document.getElementById('map');
  var mousedown_x, mousedown_y, mouseup_x, mouseup_y;
  var infosFillDiv = document.getElementById('displayInfo');
  var searchParams;

  var onSuccessNeo = function(response, error){
    if (error != undefined) {
      console.error(error);
    } else {
      console.log(response);
      showNeoInfos(response._source);
    }
  };

  var onSuccessEquipage = function(response, error){
    if (error != undefined) {
      console.error(error);
    } else {
      console.log(response);
      showEquipageInfos(response._source);
    }
  };

  var callback = function(feature, layer) {
    var doc_id = feature.get('doc_id');
    console.log("_id = "+doc_id);
    if (!feature.get('isCircle')) {
      if (showEquipage) {
        searchParams = ofeature.getFeatureParams(NEOCONFIG.es.index, NEOCONFIG.es.type.equipage, doc_id)
        oes.getExec(searchParams, onSuccessEquipage, null);
      } else {
        searchParams = ofeature.getFeatureParams(NEOCONFIG.es.index, NEOCONFIG.es.type.neo, doc_id)
        oes.getExec(searchParams, onSuccessNeo, null);
      }
    }
  }

  mapDiv.addEventListener('mousedown', function(event) {
    mousedown_x = event.layerX;
    mousedown_y = event.layerY;
  });

  mapDiv.addEventListener('mouseup', function(event) {
    mouseup_x = event.layerX;
    mouseup_y = event.layerY;

    if (mousedown_x == mouseup_x && mousedown_y == mouseup_y) {
      // var toz = map.hasFeatureAtPixel([mouseup_x, mouseup_y], {'hitTolerance':3});
      // console.log(toz);
      infosFillDiv.innerHTML = "";
      map.forEachFeatureAtPixel([mouseup_x, mouseup_y], callback, {'hitTolerance':3});
    }
  });

  mapDiv.addEventListener('mousemove', function(event) {
      var x = event.layerX;
      var y = event.layerY;
      var hasFeatureAtPixel =  map.hasFeatureAtPixel([x, y], {'hitTolerance':3});
      if (hasFeatureAtPixel) {
        mapDiv.style.cursor = 'pointer';
      } else {
        mapDiv.style.cursor = 'auto';
      }
  });
}



/**
* Permet de recuperer et afficher uniquement les features qui seront visibles sur la carte
*/
function getFeaturesInMapExtent() {

  //recuperer le filtre de recherche
  var searchParams;
  if (showEquipage) {
    searchParams = oequipageManager.getEquipagesInMapExtentSearchParams(NEOCONFIG.es.index);
  } else {
    searchParams = ofeature.getNeoInMapExtentSearchParams(NEOCONFIG.es.index);
  }

  var onSuccess = function(response){
    if(response.hits.hits){
      //rafraichir la carte
      //  console.log(response.hits.hits);
      if (showEquipage) {
        omap.refreshPositionsEquipages(response.hits.hits);
      } else {
        omap.refreshPositionsNeo(response.hits.hits);
      }
      //noter la date de la query
      lastDateQuery = Date.now();
      if (allowXHR) {
        allowXHR = false;
      }
    }
  };
  //checher/executer
  oes.searchExec(searchParams, onSuccess, null);

}


// Methode permettant d'afficher et de cacher le menu (seulement sur smartphone)
function toggleMenu() {
  if (isMenuVisible) {
    document.getElementById('sidebar').style.display = 'none';
    document.getElementById('map').style.left = "0";
    document.getElementById('map').style.width = "100%";
    map.updateSize();
    isMenuVisible = false;
  }
  else {
    document.getElementById('sidebar').style.display = 'block';
    document.getElementById('map').style.left = "25%";
    document.getElementById('map').style.width = "75%";
    map.updateSize();
    isMenuVisible = true;
  }
}

function changeDisplay() {
  if (showEquipage) {
    document.getElementsByClassName('toz-on')[0].style.display = 'none';
    document.getElementsByClassName('toz-off')[0].style.display = 'block';
    showEquipage = false;
  } else {
    document.getElementsByClassName('toz-off')[0].style.display = 'none';
    document.getElementsByClassName('toz-on')[0].style.display = 'block';
    showEquipage = true;
  }
  getFeaturesInMapExtent();
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

// // handler du clic sur le bouton creer un evenement
// function handleCreateEvent() {
//   var form = document.getElementById('evenementForm');
//   var titre = form.evtTitre.value;
//   var description = form.evtDescription.value;
//   if (titre != '') {
//     addEvent(titre, description);
//   } else {
//     showError('Titre non indiqué', 'evtError');
//   }
// }
//
// // ajout d'un evenement dans ES si cela est possible
// function addEvent(titre, description) {
//   if (ouser.id == null) {
//     showError('Connexion requise', 'idError');
//     return;
//   }
//
//   if (sessionStorage.lastPosition != undefined || isGPSReady) {
//     var docEvent = {};
//     docEvent[_EVENT_TITRE] = titre;
//     var pos = JSON.parse(sessionStorage.lastPosition);
//     docEvent[_EVENT_X] = pos[0];
//     docEvent[_EVENT_Y] = pos[1];
//     docEvent[_EVENT_AUTHOR] = ouser.id;
//     if (description != '') {
//       docEvent[_EVENT_DESCRIPTION] = description;
//     }
//     client.index({
//       index: INDEX,
//       type: EVENT_TYPE,
//       body: docEvent
//     }, function (error, response) {
//       if (error != undefined) {
//         console.error(error);
//       } else {
//         console.log(response);
//         showNotification('Évènement '+titre+' créé', 'evtSuccess');
//         var form = document.getElementById('evenementForm');
//         form.evtTitre.value = '';
//         form.evtDescription.value = '';
//       }
//     });
//   } else {
//       showError('Cliquez sur la carte pour indiquer votre position', 'evtInfo');
//   }
// }
