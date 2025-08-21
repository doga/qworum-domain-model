// RDF
import { iri, IRI, IRL, rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { GroupId, UserId, group_id, user_id } from "./id.mjs";
import { IndividualVcard, GroupVcard } from "./vcard.mjs";
import { defaultRoleset } from "./membership-annotations/role.mjs";
import { textToHash } from "./util/hash.mjs";

/**
 * Represents a user persona in a Qworum session.
 */
class Persona {
  /**
   * The user. Identifies the persona along with the group id.
   * @type {UserId} 
   **/ 
  #userId;

  /**
   * The user. Identifies the persona along with the user id.
   * @type {GroupId} 
   **/ 
  #groupId;

  /** 
   * The user's vcard.
   * @type {IndividualVcard} 
   **/ 
  #userVcard;

  /** 
   * The group's vcard.
   * @type {GroupVcard} 
   **/ 
  #groupVcard;

  /** 
   * The roles the user has when acting on behalf of the group in Qworum services.
   * @type {IRI[]} 
   **/ 
  #userRoleIds;

  /** 
   * Defines the set of roles that the user is allowed to have when acting on behalf of a group 
   * that is in a partnership. In other works, this is a mask for user's roles.
   * This property is ignored if the group is not in a partnership.
   * @type {IRI[]} 
   **/ 
  #groupRoleIds;

  /** 
   * The other groups whose data the user can access, within the restrictions of the user's roles.
   * This set is empty if the user's group is not part of a partnership.
   * @type {GroupId[]} 
   **/ 
  #partnerGroupIds;

  /**
   * @returns {UserId}
   */
  get userId(){return this.#userId;}

  /**
   * @returns {GroupId}
   */
  get groupId(){return this.#groupId;}

  /**
   * @returns {IndividualVcard}
   */
  get userVcard(){return this.#userVcard;}

  /**
   * @returns {GroupVcard}
   */
  get groupVcard(){return this.#groupVcard;}

  /**
   * @returns {IRI[]}
   */
  get userRoleIds(){return [...this.#userRoleIds];}

  /**
   * @returns {IRI[]}
   */
  get groupRoleIds(){return [...this.#groupRoleIds];}

  /**
   * @returns {IRI[]}
   */
  get partnerGroupIds(){return [...this.#partnerGroupIds];}

  /**
   * Creates a persona object. The default role for the user and the group is
   * @param {{groupId: GroupId, userId: UserId, userVcard: IndividualVcard, groupVcard: GroupVcard, userRoleIds: IRI[] | undefined, groupRoleIds: IRI[] | undefined, partnerGroupIds: GroupId[] | undefined}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    if (!(typeof persona === 'object' && !(persona instanceof Array))) {
      throw new TypeError('argument must be an object');
    }
    if (!persona.groupId) {
      throw new TypeError('Persona must have a groupId');
    }
    if (persona.groupId && !(persona.groupId instanceof GroupId)) {
      throw new TypeError('Persona groupId must be a GroupId');
    }
    if (!(persona.userId instanceof UserId)) {
      throw new TypeError('Persona userId must be a UserId');
    }
    if (!(
      persona.userVcard instanceof IndividualVcard &&
      persona.userVcard.ownerId.equals(persona.userId)
    )) {
      throw new TypeError("Not the user's vcard");
    }
    if (!(
      persona.groupVcard instanceof GroupVcard &&
      persona.groupVcard.ownerId.equals(persona.groupId)
    )) {
      throw new TypeError("Not the group's vcard");
    }
    if (!(persona.userRoleIds instanceof Array)) persona.userRoleIds = [];
    if(persona.userRoleIds.length === 0) persona.userRoleIds = [defaultRoleset.findRole(/\/top$/).roleId];
    if (!persona.userRoleIds.every(role => role instanceof IRI)) {
      throw new TypeError('Not a user roles array');
    }
    if (!(persona.groupRoleIds instanceof Array)) persona.groupRoleIds = [];
    if (!persona.groupRoleIds.every(role => role instanceof IRI)) {
      throw new TypeError('Not a group roles array');
    }
    if (!(persona.partnerGroupIds instanceof Array)) persona.partnerGroupIds = [];
    if (!persona.partnerGroupIds.every(role => role instanceof GroupId)) {
      throw new TypeError('Partner groups must be an array of GroupIds');
    }

    persona.userRoleIds     = persona.userRoleIds ?? [];
    persona.groupRoleIds    = persona.groupRoleIds ?? [];
    persona.partnerGroupIds = persona.partnerGroupIds ?? [];

    this.#userId         = persona.userId;
    this.#groupId        = persona.groupId;
    this.#userVcard      = persona.userVcard;
    this.#groupVcard     = persona.groupVcard;
    this.#userRoleIds     = [...persona.userRoleIds];
    this.#groupRoleIds    = [...persona.groupRoleIds];
    this.#partnerGroupIds = [...persona.partnerGroupIds];
  }

  /**
   * This method tells a Qworum service if a user if permitted to take an action.
   * @param {IRI[]} roleIds user must be entitled to at least one of these roles to be permitted
   * @returns {boolean}
   */
  userFitsAnyOf(roleIds){
    // one of the roles must be in both group roles and user roles (group roles are acting as a mask over user roles)
    return !!roleIds.find( 
      r => ((
        // role allowed for group?

        this.partnerGroupIds.length === 0 || 
        this.groupRoleIds.length === 0 || 
        this.groupRoleIds.find(gr => r.equals(gr))
      ) && (
        // role allowed for user?

        // this.userRoleIds.length === 0 || 
        this.userRoleIds.find(ur => r.equals(ur))
      ))
    );
  }


  /**
   * This may be useful for identifying users in databases that don't support IRIs as primary keys.
   * @returns {string} a SHA-256 hash
   */
  hashUserId(){
    return textToHash(`${this.userId}`)
  }

  /**
   * This may be useful for identifying groups in databases that don't support IRIs as primary keys.
   * @returns {string} a SHA-256 hash
   */
  hashGroupId(){
    return textToHash(`${this.groupId}`)
  }

  /**
   * Writes this object to a new RDF dataset.
   * @returns {object} an RDF dataset
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  toDataset(){
    const dataset = rdf.dataset();
    this.writeTo(dataset);
    return dataset;
  }

  /**
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    const
    userRolePredicate     = t.namedNode(`${QRM}userRole`),
    groupRolePredicate    = t.namedNode(`${QRM}groupRole`),
    partnerGroupPredicate = t.namedNode(`${QRM}partnerGroup`),
    personaTerm           = t.blankNode();

    this.userId.writeTo(dataset);
    this.groupId.writeTo(dataset);

    this.userVcard.writeTo(dataset);
    this.groupVcard.writeTo(dataset);

    dataset.add(t.quad(personaTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`)));

    for (const userRoleId of this.userRoleIds) {
      // console.debug(`[Persona toDataset] userRoleId`, userRoleId);
      dataset.add(t.quad(personaTerm, userRolePredicate, t.namedNode(`${userRoleId}`)));
    }

    for (const groupRoleId of this.groupRoleIds) {
      dataset.add(t.quad(personaTerm, groupRolePredicate, t.namedNode(`${groupRoleId}`)));
    }

    for (const partnerGroupId of this.partnerGroupIds) {
      dataset.add(t.quad(personaTerm, partnerGroupPredicate, t.namedNode(`${partnerGroupId}`)));
    }
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Persona}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    try {
      const
      userId  = UserId.readOneFrom(dataset),
      groupId = GroupId.readOneFrom(dataset),

      userVcard  = IndividualVcard.readOneFrom(dataset),
      groupVcard = GroupVcard.readOneFrom(dataset),

      userRolePredicate     = t.namedNode(`${QRM}userRole`),
      groupRolePredicate    = t.namedNode(`${QRM}groupRole`),
      partnerGroupPredicate = t.namedNode(`${QRM}partnerGroup`),

      userRoleIdsDs     = dataset.match(null, userRolePredicate),
      groupRoleIdsDs    = dataset.match(null, groupRolePredicate),
      partnerGroupIdsDs = dataset.match(null, partnerGroupPredicate),
      
      userRoleIds     = [],
      groupRoleIds    = [],
      partnerGroupIds = [];

      for (const userRoleIdQuad of userRoleIdsDs) {
        userRoleIds.push(iri`${userRoleIdQuad.object.value}`)
      }

      for (const groupRoleIdQuad of groupRoleIdsDs) {
        groupRoleIds.push(iri`${groupRoleIdQuad.object.value}`)
      }

      for (const partnerGroupIdQuad of partnerGroupIdsDs) {
        partnerGroupIds.push(group_id`${partnerGroupIdQuad.object.value}`)
      }

      return new Persona({userId, groupId, userVcard, groupVcard, userRoleIds, groupRoleIds, partnerGroupIds});      
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

}

export {
  Persona,
};
