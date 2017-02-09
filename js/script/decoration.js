/**
 * 
 * fonctions de decorations des markers et des circles
 * */
  
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
