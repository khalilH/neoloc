  const BASE_URL = 'http://plf.poc.plf-sso.ppol.minint.fr/esri';
  const TILE_URL = BASE_URL + '/server/rest/services/PP/FOND_PP_FINAL_512/MapServer';
  //var URL_TEMPLATE = TILE_URL + '/tile/{z}/{y}/{x}';  
  var URL_TEMPLATE = NEOCONFIG.mapServer.template;

  const LAMBERT93 = "+proj=lcc +lat_1=49 +lat_2=44 +lat_0=46.5 +lon_0=3 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs";

  const SECOND_IN_MILLIS = 1000;
  const MINUTE_IN_MILLIS = 60*SECOND_IN_MILLIS;

  const REFRESH_TIME = 6 * SECOND_IN_MILLIS;

  const EARTH_RADIUS = 6371.01;

  const _E7 = Math.pow(10, 7);
  const RESOLUTIONS = [
    1322.9193125052918,
    529.1677250021168,
    264.5838625010584,
    185.20870375074085,
    119.06273812547626,
    92.60435187537043,
    66.1459656252646,
    39.687579375158755,
    26.458386250105836,
    13.229193125052918,
    6.614596562526459,
    2.6458386250105836,
    1.3229193125052918,
    0.7937515875031751,
    0.26458386250105836,
    0.13229193125052918,
    0.06614596562526459
  ]

  // Indexs Elasticsearch
  const INDEX = 'neo';

  // Types Elasticsearch
  const NEO_TYPE = 'tests'
  const EVENT_TYPE = 'events'

  // Attributs Elasticsearch
  const _NEO_ID = 'neo_id';
  const _NEO_X = 'neo_x';
  const _NEO_Y = 'neo_y';
  const _NEO_ACCURACY = 'neo_accur';
  const _NEO_TIMESTAMP = 'neo_timestamp';
  const _NEO_HEADING = 'neo_heading';
  const _NEO_SPEED = 'neo_speed';
  const _NEO_TYPE = 'neo_type';
  const _NEO_FIN_VACATION = 'neo_fin'

  const _EVENT_TITRE = 'evt_titre';
  const _EVENT_X = 'evt_x';
  const _EVENT_Y = 'evt_y';
  const _EVENT_AUTHOR = 'evt_author';
  const _EVENT_DESCRIPTION = 'evt_description';

  var objectId = null, isGPSReady = false, id, type, dateFinVacation = 0;
  // id = identifiantRadio saisi au debut, type = type de vehicule selectionne
  var map, vectorSource;
  var watchID, lastDateQuery = Date.now(), lastDateUpdate = Date.now();
  var allowXHR = true;
  var isMenuVisible = true;
  var form = document.getElementById('myForm');;
  window.app = {};
  var app = window.app;


  var es = new ESManager(NEOCONFIG.es.host, NEOCONFIG.es.index);
  var omap = new Map();
  var ofeature = new FeatureManager();



  // Test du navigateur
  var regexp = /Firefox/;
  if (!regexp.test(navigator.userAgent)) {
    document.getElementById('firefox-missing').style.display = "block";
  } else {
    initMap();
  }