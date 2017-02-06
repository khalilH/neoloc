var ESManager = function (host)
{
	this.client = new $.es.Client({
	    hosts: host
	  });
};

/**
 * cherche les elements et execute le callback
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
	          onSuccess(response, error);
	        }
	      });
	
};

ESManager.prototype.indexExec = function (indexParams, onSuccess, onError)
{	

	      this.client.index(indexParams, function(error, response) {
	        if (error != undefined) {	        	
	          console.error(error);
	          if (error.status == 408) {
	            showError("Perte de connexion");
	            return false;
	          }
	        } else {
	          onSuccess(response, error);
	        }
	      });	      	
};