
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
  ];

  var isGPSReady = false;
  var map, vectorSource;
  var watchID, lastDateQuery = Date.now(), lastDateUpdate = Date.now();
  var allowXHR = true;
  var isMenuVisible = true;
  var form = document.getElementById('myForm');;
  window.app = {};
  var app = window.app;


  //manager ElasticSearch
  var oes = new ESManager(NEOCONFIG.es.host, NEOCONFIG.es.index);
  //actions sur la carte
  var omap = new Map();
  //manager features
  var ofeature = new FeatureManager(oes);
  //utilisateur actif
  var ouser = new User();
  //utilisateur à trouver sur la carte
  var ouserSeek = new User();
  

  // Test du navigateur
  var regexp = /Firefox/;
  if (!regexp.test(navigator.userAgent)) {
    document.getElementById('firefox-missing').style.display = "block";
  } else {
    initMap();
  }