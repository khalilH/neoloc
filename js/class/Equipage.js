var Equipage = function()
{
  this.ESid = null;
  this.id = null;
  this.composition = null;
  this.femme = null;
  this.hors_Police = null;
  this.equipements = null; // [] array
  this.date_creation = null;
};

Equipage.prototype.clean = function() {
    this.ESid = null;
    this.id = null;
    this.composition = null;
    this.femme = null;
    this.hors_Police = null;
    this.equipements = null; // [] array
    this.date_creation = null;
};
