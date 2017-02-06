

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

  // permet de mettre a jour le type, l'idRadio ete la date/heure de fin de vacation
  function refreshId() {
    var idRadio = form.idRadio.value;
    var _type = form.type.value;
    var _date = document.getElementById('finVacation').value;
    if (idRadio != '0000' && idRadio != '' && _type != '') {
      id = idRadio;
      type = _type;
      if (_date != '') {
        var tmp = new Date(_date);
        dateFinVacation = tmp.getTime();
      }
      else {
        dateFinVacation = 0;
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
      id = idRadio;
      type = _type;
      if (_date != '') {
        var tmp = new Date(_date);
        dateFinVacation = tmp.getTime();
      }
      else {
        dateFinVacation = 0;
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

  // Lancement de l'application en mode user
  function startUserMode() {
    if (navigator.geolocation) {
      openNotification("Géolocalisation en cours, cliquez sur la carte pour indiquer votre position");
      var point;
      client.search({
        index: INDEX,
        type: NEO_TYPE,
        body: {
          query : { match : {"neo_id" : id }}
        }
      }, function(error, response) {
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
                addFeature(5, 0, 0, mapPoint);
              } else {
                updateFeature(5, 0, 0, mapPoint);
                lastDateUpdate = Date.now();
              }
              updateLocalFeatureGeometry(mapPoint.x, mapPoint.y);
              sessionStorage.lastPosition = JSON.stringify(coordinates);
            }
          }
        })
        getLocation();
      });

    } else {
      showError("Géolocalisation non supportée");
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
    refreshId();
    if (objectId == null) {
      addFeature(accuracy, heading, speed, mapPoint_2154);
    } else {
      updateFeature(accuracy, heading, speed, mapPoint_2154);
    }
  }

  // Cree un document representant la position d'un utilisateur
  function createDocument(id, type, x, y, accuracy, heading, speed, timestamp) {
    var doc = {};
    doc[_NEO_ID] = id;
    doc[_NEO_TYPE] = type;
    if (dateFinVacation != 0) {
      doc[_NEO_FIN_VACATION] = dateFinVacation;
    }
    doc[_NEO_X] = x;
    doc[_NEO_Y] = y;
    doc[_NEO_ACCURACY] = accuracy;
    doc[_NEO_TIMESTAMP] = timestamp;
    doc[_NEO_HEADING] = heading;
    doc[_NEO_SPEED] = speed;
    return doc;
  }

  // Indexation d'un nouveau document(position) dans ES
  function addFeature(accuracy, heading, speed, mapPoint) {
    var doc = createDocument(id, type, mapPoint.x, mapPoint.y, accuracy, heading, speed, Date.now());

    client.index({
      index: INDEX,
      type: NEO_TYPE,
      body: doc
    }, function (error, response) {
      if (error != undefined) {
        console.error(error);
      } else {
        objectId = response._id;
        if (!allowXHR) {
          allowXHR = true;
        }
        console.log(objectId);
      }
    });
  }

  // Mise a jour d'un document(position) deja indexe dans ES
  function updateFeature(accuracy, heading, speed, mapPoint) {
    var doc = createDocument(id, type, mapPoint.x, mapPoint.y, accuracy, heading, speed, Date.now());

    client.index({
      index: INDEX,
      type: NEO_TYPE,
      id: objectId,
      body: doc
    }, function (error, response) {
      if (error != undefined) {
        console.error(error);
      } else {
        console.log(response);
        if (!allowXHR) {
          allowXHR = true;
        }
      }
    });
  }

  // Permet de mettre a jour localement la position et le type de ma feature
  function updateLocalFeatureGeometry(x, y) {
    var features = vectorSource.getFeatures();
    var length = features.length;
    for (var i = 0; i < length; i++) {
      if (features[i].get('neo_id') == id) {
        refreshId()
        features[i].setGeometry(new ol.geom.Point([x, y]));
        features[i].set('type', type);
        vectorSource.refresh();
        return;
      }
    }
    var point = new ol.geom.Point([x, y]);
    var feat = new ol.Feature({geometry: point});
    feat.set('color', 'red');
    feat.set('neo_id', id);
    feat.set('type', type);
    feat.setStyle(markerStyle);
    vectorSource.addFeature(feat);
    vectorSource.refresh();
  }

  // /!\ POUR INFO : deplacee dans la methode initMap car il y a du code a executer dans le callback /!\
  // permet de recuperer ma feature (et donc objectID) a partir de mon identifiant radio
  // si et seulement si j'existe deja
  // function getMyFeature() {
  //   client.search({
  //     index: INDEX,
  //     type: ES_TYPE,
  //     body: {
  //       query : { match : {"neo_id" : id }}
  //     }
  //   }, function(error, response) {
  //     if (error != undefined) {
  //       console.error(error);
  //     } else if (response.hits.total == 0) {
  //       console.log(id+' non present dans la base');
  //     } else {
  //       console.log(response.hits.hits[0]);
  //       objectId = response.hits.hits[0]._id;
  //     }
  //   });
  // }





  // Permet de mettre a jour l'affichage des positions sur la carte
  function refresh(hits) {
    refreshId();
    var i, length = hits.length;
    if (length == 0) return;
    console.log('refresh');
    vectorSource.clear();
    for (i = 0; i < length ; i++) {
      var feature = hits[i];
      var timestamp = feature._source.neo_timestamp;
      var delta = Date.now() - timestamp;
      if (delta > 60*6 * MINUTE_IN_MILLIS) {
        continue;
      }
      if (feature._source.neo_accur > 24) {
        addCircle(feature, delta);
      }
      addMarker(feature, delta);
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
          text: zoom > 8 ? this.get('neo_id') : '', // revoir les param de zoom
        }),
        image: new ol.style.Icon(({
          src: zoom < 5 ? 'images/dot'+suffixe+'.png':
          zoom < 9 ? 'images/'+type+suffixe+'_16.png' :
          'images/'+type+suffixe+'.png'
        }))
      })
    ];
  }

  // Permet d'ajouter un cercle d'incertitude sur la map a partir d'une feature
  // delta : temps depuis la derniere mise a jour de la feature
  function addCircle(feature, delta) {
    var neo_id = feature._source.neo_id;
    var radius = feature._source.neo_accur;
    var x = feature._source.neo_x;
    var y = feature._source.neo_y;
    var circle = new ol.geom.Circle([x, y], radius);
    var feat = new ol.Feature({geometry: circle});
    if (neo_id == id) {
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


  // permet d'ajouter un marker sur la map a partir d'une feature
  // delta : temps depuis la derniere mise a jour de la feature
  function addMarker(feature, delta) {
    var neo_id = feature._source.neo_id;
    var x = feature._source.neo_x;
    var y = feature._source.neo_y;
    var neo_type = feature._source.neo_type;
    var point = new ol.geom.Point([x, y]);
    var feat = new ol.Feature({geometry: point});
    if (neo_id == id) {
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
    var form = document.getElementById('evenementForm')
    var titre = form.evtTitre.value;
    var description = form.evtDescription.value;
    if (titre != '') {
      addEvent(titre, description)
    } else {
      showError('Titre non indiqué', 'evtError')
    }
  }

  // ajout d'un evenement dans ES si cela est possible
  function addEvent(titre, description) {
    if (id == undefined) {
      showError('Connexion requise', 'idError');
      return;
    }

    if (sessionStorage.lastPosition != undefined || isGPSReady) {
      var docEvent = {};
      docEvent[_EVENT_TITRE] = titre;
      var pos = JSON.parse(sessionStorage.lastPosition);
      docEvent[_EVENT_X] = pos[0];
      docEvent[_EVENT_Y] = pos[1];
      docEvent[_EVENT_AUTHOR] = id;
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
          var form = document.getElementById('evenementForm')
          form.evtTitre.value = '';
          form.evtDescription.value = '';
        }
      });
    } else {
        showError('Cliquez sur la carte pour indiquer votre position', 'evtInfo');
    }
  }