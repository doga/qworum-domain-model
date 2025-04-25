
import { URN, rdfTerm as t, rdf, } from '../deps.mjs';
import ttg from "./util/tagged-template-generator.mjs";

const
PREFIX           = 'urn:qworum',
ENTITY_ID_FORMAT = /^[a-fA-F0-9-]{30,50}$/,
rdfns              = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
qrm              = 'https://vocab.qworum.net/';


class Id extends URN {
  /** @type {string} */ idType;
  /** @type {string} */ bareId; 

  /**
   * 
   * @param {string} idString 
   */
  constructor(idString) {
    super(idString);
    const 
    typeAndId = this.namespaceSpecific.split(':'),
    idType    = typeAndId.shift(),
    bareId    = typeAndId.join(':');

    this.idType   = idType;
    this.bareId   = bareId;
  }

  /**
   * 
   * @param {string} idType 
   * @param {(string | string[])} bareId 
   * @returns {Id}
   * @throws {TypeError}
   */
  static create(idType, bareId) {
    if (bareId instanceof Array) {
      bareId = bareId.join(':');
    }
    const id = new Id(`${PREFIX}:${idType}:${bareId}`);
    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');
    return id;
  }

  /**
   * 
   * @param {string} idType 
   * @returns {Id}
   */
  static uuid(idType) {
    const
    bareId = crypto.randomUUID(),
    id     = new Id(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }

  /**
   * 
   * @param {object} dataset 
   * @param {string} rdfType 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset, rdfType){
    dataset.add(
      t.quad(t.namedNode(this.toString()), t.namedNode(`${rdfns}type`), t.namedNode(`${rdfType}`))
    );
  }

  /**
   * 
   * @param {string} rdfType 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  toDataset(rdfType){
    const dataset = rdf.dataset();
    dataset.add(t.quad( t.namedNode(this.toString()), t.namedNode(`${rdfns}type`), t.namedNode(`${rdfType}`) ));
    return dataset;
  }

  /**
   * 
   * @param {object} dataset 
   * @param {string} rdfType 
   * @returns {Id[]}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset, rdfType){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${rdfType}`));

    for (const quad of matchDs) {
      try {
        const 
        id = new Id(quad.subject.value);
        if(!id)throw new Error('not an id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @param {string} rdfType 
   * @returns {(Id|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset, rdfType){
    try {
      const ids = Id.readFrom(dataset, rdfType);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

}


class OrgId extends Id {
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'org') throw new TypeError('invalid entity type for org');
  }

  /**
   * 
   * @param {string} bareId 
   * @returns {OrgId}
   * @throws {TypeError}
   */
  static create(bareId) {
    return new OrgId(`${PREFIX}:${'org'}:${bareId}`);
  }

  /**
   * 
   * @returns {OrgId}
   */
  static uuid() {
    const
    idType = 'org',
    bareId = crypto.randomUUID(),
    id     = new OrgId(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }

  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    super.writeTo(dataset, `${qrm}Org`);
  }

  /**
   * 
   */
  toDataset(){
    return super.toDataset(`${qrm}Org`);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {OrgId[]}
   */
  static readFrom(dataset){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${qrm}Org`));

    for (const quad of matchDs) {
      try {
        const 
        id = new OrgId(quad.subject.value);
        if(!id)throw new Error('not an org id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(OrgId|null)}
   */
  static readOneFrom(dataset){
    try {
      const ids = OrgId.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

}


class UserId extends Id {
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'user') throw new TypeError('invalid entity type for user');
  }

  /**
   * 
   * @param {string} bareId 
   * @returns {UserId}
   * @throws {TypeError}
   */
  static create(bareId) {
    return new UserId(`${PREFIX}:${'user'}:${bareId}`);
  }

  /**
   * 
   * @returns {UserId}
   */
  static uuid() {
    const
    idType = 'user',
    bareId = crypto.randomUUID(),
    id     = new UserId(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }


  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    super.writeTo(dataset, `${qrm}User`);
  }

  /**
   * 
   */
  toDataset(){
    return super.toDataset(`${qrm}User`);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {UserId[]}
   */
  static readFrom(dataset){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${qrm}User`));

    for (const quad of matchDs) {
      try {
        const 
        id = new UserId(quad.subject.value);
        if(!id)throw new Error('not a user id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(UserId|null)}
   */
  static readOneFrom(dataset){
    try {
      const ids = UserId.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

}


class PersonaId extends Id {
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'persona') throw new TypeError('invalid entity type for persona');
  }

  /**
   * 
   * @param {string} bareId 
   * @returns {PersonaId}
   * @throws {TypeError}
   */
  static create(bareId) {
    return new PersonaId(`${PREFIX}:${'persona'}:${bareId}`);
  }

  /**
   * 
   * @returns {PersonaId}
   */
  static uuid() {
    const
    idType = 'persona',
    bareId = crypto.randomUUID(),
    id     = new PersonaId(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }

  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    super.writeTo(dataset, `${qrm}Persona`);
  }

  /**
   * 
   */
  toDataset(){
    return super.toDataset(`${qrm}Persona`);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {PersonaId[]}
   */
  static readFrom(dataset){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${qrm}Persona`));

    for (const quad of matchDs) {
      try {
        const 
        id = new PersonaId(quad.subject.value);
        if(!id)throw new Error('not a persona id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(PersonaId|null)}
   */
  static readOneFrom(dataset){
    try {
      const ids = PersonaId.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }
}


class PasswordId extends Id { // TODO make this an IRL?
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'password') throw new TypeError('invalid entity type for password');
  }

  /**
   * 
   * @param {UserId} userId 
   * @returns {PasswordId}
   * @throws {TypeError}
   */
  static forUser(userId) {
    if (!(userId instanceof UserId)) {
      throw new TypeError('userId must be a UserId');
    }
    return new PasswordId(`${PREFIX}:${'password'}:${userId.bareId}`);
  }
}



class GroupId extends Id {
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'group') throw new TypeError('invalid entity type for group');
  }

  /**
   * 
   * @param {string} bareId 
   * @returns {GroupId}
   * @throws {TypeError}
   */
  static create(bareId) {
    return new GroupId(`${PREFIX}:${'group'}:${bareId}`);
  }

  /**
   * 
   * @returns {GroupId}
   */
  static uuid() {
    const
    idType = 'group',
    bareId = crypto.randomUUID(),
    id     = new GroupId(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }

  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    super.writeTo(dataset, `${qrm}Group`);
  }

  /**
   * 
   */
  toDataset(){
    return super.toDataset(`${qrm}Group`);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {GroupId[]}
   */
  static readFrom(dataset){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${qrm}Group`));

    for (const quad of matchDs) {
      try {
        const 
        id = new GroupId(quad.subject.value);
        if(!id)throw new Error('not a group id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(GroupId|null)}
   */
  static readOneFrom(dataset){
    try {
      const ids = GroupId.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

}

class CollabId extends Id {
  /**
   * 
   * @param {string} idString 
   * @throws {TypeError}
   */
  constructor(idString) {
    super(idString);
    if(this.idType !== 'collab') throw new TypeError('invalid entity type for collab');
  }

  /**
   * 
   * @param {string} bareId 
   * @returns {CollabId}
   * @throws {TypeError}
   */
  static create(bareId) {
    return new CollabId(`${PREFIX}:${'collab'}:${bareId}`);
  }

  /**
   * 
   * @returns {CollabId}
   */
  static uuid() {
    const
    idType = 'collab',
    bareId = crypto.randomUUID(),
    id     = new CollabId(`${PREFIX}:${idType}:${bareId}`);

    if(!id.bareId.match(ENTITY_ID_FORMAT)) throw new TypeError('invalid entity id format');

    return id;
  }

  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    super.writeTo(dataset, `${qrm}Collab`);
  }

  /**
   * 
   */
  toDataset(){
    return super.toDataset(`${qrm}Collab`);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {CollabId[]}
   */
  static readFrom(dataset){
    const
    res = [],
    matchDs = dataset.match(null, t.namedNode(`${rdfns}type`), t.namedNode(`${qrm}Collab`));

    for (const quad of matchDs) {
      try {
        const 
        id = new CollabId(quad.subject.value);
        if(!id)throw new Error('not a collab id');
        res.push(id);
      } catch (_error) {
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(CollabId|null)}
   */
  static readOneFrom(dataset){
    try {
      const ids = CollabId.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

}

/** 
 * Tagged-template parser.
 * @type {function} 
 * @param {string} stringValue
 * @returns {OrgId?}
 **/
const orgid = ttg(OrgId);


/** 
 * Tagged template parser for org IDs.
 * @returns {OrgId?} 
 **/
function bareorgid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return OrgId.create(res);
  } catch (_error) {
    return null;
  }
}


/** 
 * Tagged-template parser.
 * @type {function} 
 * @param {string} stringValue
 * @returns {GroupId?}
 **/
const groupid = ttg(GroupId);


/** 
 * Tagged template parser for group IDs.
 * @returns {GroupId?} 
 **/
function baregroupid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return GroupId.create(res);
  } catch (_error) {
    return null;
  }
}



/** 
 * Tagged-template parser.
 * @type {function} 
 * @param {string} stringValue
 * @returns {CollabId?}
 **/
const collabid = ttg(CollabId);



/** 
 * Tagged template parser for collab IDs.
 * @returns {CollabId?} 
 **/
function barecollabid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return CollabId.create(res);
  } catch (_error) {
    return null;
  }
}



/** 
 * Tagged-template parser.
 * @type {function} 
 * @param {string} stringValue
 * @returns {PersonaId?}
 **/
const personaid = ttg(PersonaId);



/** 
 * Tagged-template parser.
 * @type {function} 
 * @param {string} stringValue
 * @returns {UserId?}
 **/
const userid = ttg(UserId);



/** 
 * Tagged template parser for user IDs.
 * @returns {UserId?} 
 **/
function bareuserid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return UserId.create(res);
  } catch (_error) {
    return null;
  }
}


export { 
  Id, OrgId, GroupId, UserId, PasswordId, CollabId, PersonaId,
  orgid, groupid, userid, collabid, personaid,
  bareorgid, baregroupid, bareuserid, barecollabid,
};
