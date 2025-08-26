// RDF
import { iri, IRI, IRL, rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { GroupId, UserId, group_id, user_id, GroupIdSet } from "./id.mjs";
import { IndividualVcard, GroupVcard } from "./vcard.mjs";
// import { defaultRoleset } from "./membership-annotations/role.mjs";
// import { textToHash } from "./util/hash.mjs";

/**
 * Represents a persona in a Qworum session, which identifies not only the end-user, but also the group that he/she belongs to.
 * 
 * The end-users of Qworum applications are always acting on behalf of a group, and the data produced is owned by the group.
 * 
 * This group-centric model of data ownership has some nice properties, such as facilitating teamwork. In addition, having groups as a first-class platform concept allows multiple groups to partner with each other and act as a single group, which is useful in many intra-org and inter-org scenarios. 
 */
class Persona {
  /**
   * Identifies the user.
   * @type {UserId} 
   **/ 
  #userId;

  /**
   * Identifies the group that the user is acting on behalf of.
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
   * The roles the user has when using Qworum services on behalf of the group.
   * @type {IRL[]} 
   **/ 
  #userRoleIds;

  /** 
   * Defines the set of roles that the user is allowed to have when acting on behalf of a group 
   * that is in a partnership. In other works, this is a mask for user's roles.
   * This property is ignored if the group is not in a partnership.
   * @type {IRL[]} 
   **/ 
  #groupRoleIds;

  /** 
   * The other groups whose data the user can access, within the restrictions of the user's roles.
   * This set is empty if the user's group is not part of a partnership.
   * @type {(GroupIdSet | null)} 
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
   * @returns {IRL[]}
   */
  get userRoleIds(){return [...this.#userRoleIds];}

  /**
   * @returns {IRL[]}
   */
  get groupRoleIds(){return [...this.#groupRoleIds];}

  /**
   * @returns {(GroupIdSet | null)}
   */
  get partnerGroupIds(){return this.#partnerGroupIds?.clone() ?? null;}

  // /**
  //  * Creates a persona object. The default role for the user and the group is
  //  * @param {{groupId: GroupId, userId: UserId, userVcard: IndividualVcard, groupVcard: GroupVcard, userRoleIds: IRI[] | undefined, groupRoleIds: IRI[] | undefined, partnerGroupIds: GroupId[] | undefined}} persona 
  //  * @throws {TypeError}
  //  */

  /**
   * Creates a persona object.
   * @param {{groupId: GroupId, userId: UserId, userVcard: IndividualVcard, groupVcard: GroupVcard, partnerGroupIds: GroupIdSet | undefined}} persona 
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
    // if (!(persona.userRoleIds instanceof Array)) persona.userRoleIds = [];
    // if(persona.userRoleIds.length === 0) persona.userRoleIds = [defaultRoleset.findRole(/\/top$/).roleId];
    // if (!persona.userRoleIds.every(role => role instanceof IRI)) {
    //   throw new TypeError('Not a user roles array');
    // }
    // if (!(persona.groupRoleIds instanceof Array)) persona.groupRoleIds = [];
    // if (!persona.groupRoleIds.every(role => role instanceof IRI)) {
    //   throw new TypeError('Not a group roles array');
    // }
    if (!(persona.partnerGroupIds === undefined || persona.partnerGroupIds instanceof GroupIdSet)) {
      throw new TypeError("Partner groups must be a GroupIdSet");
    }

    // persona.userRoleIds     = persona.userRoleIds ?? [];
    // persona.groupRoleIds    = persona.groupRoleIds ?? [];
    persona.partnerGroupIds = persona.partnerGroupIds ?? new GroupIdSet();

    this.#userId         = persona.userId;
    this.#groupId        = persona.groupId;
    this.#userVcard      = persona.userVcard;
    this.#groupVcard     = persona.groupVcard;
    // this.#userRoleIds     = [...persona.userRoleIds];
    // this.#groupRoleIds    = [...persona.groupRoleIds];
    this.#partnerGroupIds = persona.partnerGroupIds.clone();
  }


  /*
  Role ids are IRLs or URLs, not URNs.

  All role ids in a roleset must have the same origin IRL/URL.

  If a user has no roles whose origin is the same as a roleset's origin, then
  by default the user has all of the roles defined in that roleset.
   */
  
  /**
   * This method tells the Qworum service what a persona is permitted to do.
   * @param {IRL} roleId 
   * @returns {boolean}
   */
  hasRole(roleId){
    const 
    /** @type {boolean} */
    groupHasRole = (
      // if group is not in a partnership, then it has all roles
      !this.partnerGroupIds || 
      
      // ⬇︎ group is in a partnership ⬇︎
      
      // if group has none of the roles in `roleId`s roleset (identified by its web origin),
      // then it has all of the roleset's roles
      !this.groupRoleIds.find(irl => irl.origin === roleId.origin) ||

      // does the group have the role `roleId` ?
      this.groupRoleIds.find(irl => irl.equals(roleId))
    ),

    /** @type {boolean} */
    userHasRole = (
      // if user has none of the roles in `roleId`s roleset (identified by its web origin),
      // then user has all of the roleset's roles
      !this.userRoleIds.find(irl => irl.origin === roleId.origin) ||

      // does the user have the role `roleId` ?
      this.userRoleIds.find(irl => irl.equals(roleId))
    );

    return groupHasRole && userHasRole;
  }


  // /**
  //  * This may be useful for identifying users in databases that don't support IRIs as primary keys.
  //  * @returns {string} a SHA-256 hash
  //  */
  // hashUserId(){
  //   return textToHash(`${this.userId}`)
  // }

  // /**
  //  * This may be useful for identifying groups in databases that don't support IRIs as primary keys.
  //  * @returns {string} a SHA-256 hash
  //  */
  // hashGroupId(){
  //   return textToHash(`${this.groupId}`)
  // }

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
    // userRolePredicate     = t.namedNode(`${QRM}userRole`),
    // groupRolePredicate    = t.namedNode(`${QRM}groupRole`),
    partnerGroupPredicate = t.namedNode(`${QRM}partnerGroup`),
    personaTerm           = t.blankNode();

    this.userId.writeTo(dataset);
    this.groupId.writeTo(dataset);

    this.userVcard.writeTo(dataset);
    this.groupVcard.writeTo(dataset);

    dataset.add(t.quad(personaTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`)));

    // for (const userRoleId of this.userRoleIds) {
    //   // console.debug(`[Persona toDataset] userRoleId`, userRoleId);
    //   dataset.add(t.quad(personaTerm, userRolePredicate, t.namedNode(`${userRoleId}`)));
    // }

    // for (const groupRoleId of this.groupRoleIds) {
    //   dataset.add(t.quad(personaTerm, groupRolePredicate, t.namedNode(`${groupRoleId}`)));
    // }

    for (const partnerGroupId of this.partnerGroupIds.members) {
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

      // userRolePredicate     = t.namedNode(`${QRM}userRole`),
      // groupRolePredicate    = t.namedNode(`${QRM}groupRole`),
      partnerGroupPredicate = t.namedNode(`${QRM}partnerGroup`),

      // userRoleIdsDs     = dataset.match(null, userRolePredicate),
      // groupRoleIdsDs    = dataset.match(null, groupRolePredicate),
      partnerGroupIdsDs = dataset.match(null, partnerGroupPredicate),
      
      // userRoleIds     = [],
      // groupRoleIds    = [],
      partnerGroupIds = new GroupIdSet();

      // for (const userRoleIdQuad of userRoleIdsDs) {
      //   userRoleIds.push(iri`${userRoleIdQuad.object.value}`)
      // }

      // for (const groupRoleIdQuad of groupRoleIdsDs) {
      //   groupRoleIds.push(iri`${groupRoleIdQuad.object.value}`)
      // }

      for (const partnerGroupIdQuad of partnerGroupIdsDs) {
        partnerGroupIds.add(group_id`${partnerGroupIdQuad.object.value}`);
      }

      return new Persona({userId, groupId, userVcard, groupVcard, partnerGroupIds});      
      // return new Persona({userId, groupId, userVcard, groupVcard, userRoleIds, groupRoleIds, partnerGroupIds});      
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

}

export { Persona };
