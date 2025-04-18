
import { URN } from '../deps.mjs';
import ttg from "./util/tagged-template-generator.mjs";

const
PREFIX            = 'urn:qworum',
ENTITY_ID_FORMAT  = /^[a-fA-F0-9-]{30,50}$/;


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
