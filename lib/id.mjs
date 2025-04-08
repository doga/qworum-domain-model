
import { URN,} from '../deps.mjs';

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
}


/** 
 * Tagged template parser for org IDs.
 * @returns {OrgId?} 
 **/
function orgid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new OrgId(res);
  } catch (_error) {
    return null;
  }
}


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
 * Tagged template parser for group IDs.
 * @returns {GroupId?} 
 **/
function groupid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new GroupId(res);
  } catch (_error) {
    return null;
  }
}


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
 * Tagged template parser for collab IDs.
 * @returns {CollabId?} 
 **/
function collabid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new CollabId(res);
  } catch (_error) {
    return null;
  }
}


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
 * Tagged template parser for user IDs.
 * @returns {UserId?} 
 **/
function userid(strings, ...values){
  let res = strings[0], i=1; 
  for (const v of values){
    res+=`${v}${strings[i]}`;i++;
  }
  try {
    return new UserId(res);
  } catch (_error) {
    return null;
  }
}


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
  Id, OrgId, GroupId, UserId, CollabId,
  orgid, groupid, userid, collabid,
  bareorgid, baregroupid, bareuserid, barecollabid,
};
