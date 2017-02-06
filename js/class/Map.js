var Map = function ()
{

};

/**
 * Permet d'obtenir les limites(extent) de la vue active de la carte en projection de lambert93
 */
Map.prototype.getExtent = function ()
{		
	    var e = map.getView().calculateExtent(map.getSize());
	    var extent = {
	      'xmin': e[0],
	      'ymin': e[1],
	      'xmax': e[2],
	      'ymax': e[3],
	    }
	    return extent;
	  	

};