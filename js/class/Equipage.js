var Equipage = function()
{
  this.ESid = null;
  this.id = null;
  this.composition = null;
  this.femme = null;
  this.hors_Police = null;
  this.equipements = [];
  this.date_creation = null;
};

Equipage.prototype.clean = function() {
    this.ESid = null;
    this.id = null;
    this.composition = null;
    this.femme = null;
    this.hors_Police = null;
    this.equipements = [];
    this.date_creation = null;
};

Equipage.prototype.saveInLocalStorage = function() {
  var tmp_ESid = localStorage.getItem(EQUIPAGE_ES_ID);
  if (tmp_ESid != null) {
    localStorage.removeItem(EQUIPAGE_ES_ID);
  }
  localStorage.setItem(EQUIPAGE_ES_ID, this.ESid);

  var tmp_date = localStorage.getItem(EQUIPAGE_DATE);
  if (tmp_date != null) {
    localStorage.removeItem(EQUIPAGE_DATE);
  }
  localStorage.setItem(EQUIPAGE_DATE, this.date_creation);
}
