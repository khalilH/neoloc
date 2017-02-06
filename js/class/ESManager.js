var ESManager = function (host)
{
	this.client = new $.es.Client({
	    hosts: host
	  });
};

/**
 * retourne les features
 */
ESManager.prototype.searchExec = function (searchParams, onSuccess, onError)
{	

	      this.client.search(searchParams, function(error, response) {
	        if (error != undefined) {	        	
	          console.error(error);
	          if (error.status == 408) {
	            showError("Perte de connexion");
	            return false;
	          }
	        } else {
	          onSuccess(response.hits.hits);
	        }
	      });
	
};