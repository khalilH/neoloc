var ESManager = function (host)
{
	this.client = new $.es.Client({
	    hosts: host,
			apiVersion: '2.4'
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

ESManager.prototype.getExec = function (getParams, onSuccess, onError)
{
	this.client.get(getParams, function(error, response) {
		if (error != undefined) {
			onError(error);
			console.log(response);
		} else {
			onSuccess(response);
		}
	});
}

ESManager.prototype.getExecREST = function (id, onSuccess)
{
	var url = 'http://plf.poc.plf-sso.ppol.minint.fr/es/dev_neo/tests/'+id;
	var xhr = new XMLHttpRequest();
	xhr.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (this.status == 200 || this.status == 404) {
				var response = JSON.parse(xhr.responseText);
				onSuccess(response);
			} else {
				console.error(this.status);
				console.error(xhr);
			}
		};
	}
	xhr.open("GET", url, true);
	xhr.send();
}
