var url = 'http://plf.poc.plf-sso.ppol.minint.fr/es/background/tests';

var i = 0;
function timedCount() {
    i = i + 1;
    var _date = (new Date(Date.now())).toLocaleString();
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", url, true);
    xhttp.send(JSON.stringify({iteration:i, time:_date}));
    postMessage(_date);
    setTimeout("timedCount()",5000);
}

timedCount();
