var Equipage = function()
{
  this.ESid = null;
  this.id = null;
  this.composition = null;
  this.femme = null;
  this.hors_Police = null;
  this.equipements = [];
  this.date_creation = null;
  this.x = null;
  this.y = null;
  this.timestamp = null;
};

Equipage.prototype.clean = function() {
    this.ESid = null;
    this.id = null;
    this.composition = null;
    this.femme = null;
    this.hors_Police = null;
    this.equipements = [];
    this.date_creation = null;
    this.x = null;
    this.y = null;
    this.timestamp = null;
};

Equipage.prototype.saveInLocalStorage = function() {
  localStorage.setItem(EQUIPAGE_ES_ID, this.ESid);
  localStorage.setItem(EQUIPAGE_DATE, this.date_creation);
}
