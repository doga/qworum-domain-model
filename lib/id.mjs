
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

  equals(other) {
    if (!(other instanceof Id)) return false;
    return this.toString() === other.toString();
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


export { Id, OrgId, GroupId, UserId};
