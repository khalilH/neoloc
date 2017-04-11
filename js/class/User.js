var User = function ()
{
	this.ESid = null;
	this.id = null;
	this.type = null;
	// this.dateFinVac = 0;
	this.x = null;
	this.y = null;
	this.accuracy = null;
	this.timestamp = null;
	this.heading = null;
	this.speed = null;
};

User.prototype.clean = function (){
	this.ESid = null;
	this.id = null;
	this.type = null;
	// this.dateFinVac = null;
	this.x = null;
	this.y = null;
	this.accuracy = null;
	this.timestamp = null;
	this.heading = null;
	this.speed = null;
};

User.prototype.getPoint = function (){
	return [this.x, this.y];
};
