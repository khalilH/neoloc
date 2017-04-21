var EquipageManager = function (es)
{
  this.es = es;
  // Attributs Elasticsearch d'un equipage
  this._EQUIPAGE_ID = "equipage_id";
  this._EQUIPAGE_COMPOSITION = "equipage_composition";
  this._EQUIPAGE_FEMME = "equipage_femme";
  this._EQUIPAGE_HORS_POLICE = "equipage_hors_police";
  this._EQUIPAGE_EQUIPEMENTS = "equipage_equipements";
  this._EQUIPAGE_DATE_CREATION = "equipage_date_creation";
};

EquipageManager.prototype.getEquipageParams = function(index, id) {
  return {
    index: index,
    type: NEOCONFIG.es.type.equipages,
    body: {
      query : { match : {"equipage_id" : id }}
    }
  };
};

EquipageManager.prototype.getUpdateEquipageParams = function (index, id, doc) {
  return {
    index: index,
    type: NEOCONFIG.es.type.equipage,
    id: id,
    body: doc
  };
};

EquipageManager.prototype.getCreateEquipageParams = function (index, doc) {
  return {
    index: index,
    type: NEOCONFIG.es.type.equipage,
    body: doc
  };
};

EquipageManager.prototype.save = function (index, equipage) {
  if (equipage.ESid == null) {
    this.create(index, equipage);
  } else {
    this.update(index, equipage);
  }
}

EquipageManager.prototype.create = function (index, equipage) {
  var doc = this.createDocument(equipage.id, equipage.composition, equipage.femme, equipage.hors_police, equipage.equipements, equipage.date_creation);

  var params = this.getCreateEquipageParams(index, doc);

  var onSuccess = function(response, error) {
    console.log("ajout equipage ok");
    console.log(response);
    equipage.ESid = response._id;
  };
  console.log(params);
  this.es.indexExec(params, onSuccess, null);
}

EquipageManager.prototype.update = function (index, equipage) {
  var doc = this.createDocument(equipage.id, equipage.composition, equipage.femme, equipage.hors_police, equipage.equipements, equipage.date_creation);

  var params = this.getUpdateEquipageParams(index, equipage.ESid, doc);

  var onSuccess = function(response, error) {
    console.log("update equipage ok");
    console.log(response);
    equipage.ESid = response._id;
  };

  this.es.indexExec(params, onSuccess, null);
};

// atention a la caleur de date_creation
EquipageManager.prototype.createDocument = function (id, composition, femme, hors_police, equipements, date_creation) {
  var doc = {};
  doc[this._EQUIPAGE_ID] = id;
  doc[this._EQUIPAGE_COMPOSITION] = composition;
  doc[this._EQUIPAGE_FEMME] = femme;
  doc[this._EQUIPAGE_HORS_POLICE] = hors_police;
  doc[this._EQUIPAGE_EQUIPEMENTS] = equipements;
  doc[this._EQUIPAGE_DATE_CREATION] = date_creation;
  return doc;
};
