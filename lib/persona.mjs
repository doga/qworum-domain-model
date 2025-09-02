// RDF
import { iri, IRI, IRL, rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF, XSD } from "./util/rdf-prefixes.mjs";

import { GroupId, UserId, group_id, user_id, GroupIdSet } from "./id.mjs";
import { IndividualVcard, GroupVcard } from "./vcard.mjs";
// import { defaultRoleset } from "./membership-annotations/role.mjs";
// import { textToHash } from "./util/hash.mjs";

/**
 * Represents a persona in a Qworum session; its basic purpose is to identify the {@link Group}+{@link User} pair who is using the Qworum application and services in a session. It contains:
 * 
 * - The {@link GroupId} of the group that the end-user is acting on behalf of.
 * - The {@link UserId} of the user.
 * - The {@link GroupId}s of the groups that the group is partnering with, if any.
 * - The {@link Role}s assigned to the user within the group.
 * - The roles assigned to the group within the {@link Partnership}, if any.
 * - The {@link Vcard}s of the user and the group.
 * - A method that decides whether a user has been assigned a certain role.
 * 
 */
class Persona {
  /** @type {UserId} */ 
  #userId;

  /** @type {GroupId} */ 
  #groupId;

  /** @type {IndividualVcard} */ 
  #userVcard;

  /** @type {GroupVcard} */ 
  #groupVcard;

  /** @type {IRL[]} */ 
  #userRoleIds;

  /** @type {IRL[]} */ 
  #groupRoleIds;

  /** @type {boolean} */ 
  #userHasAllRolesByDefault;

  /** @type {boolean} */ 
  #groupHasAllRolesByDefault;

  /** @type {(GroupIdSet | null)} */ 
  #partnerGroupIds;

  /**
   * Identifies the user.
   * @returns {UserId}
   */
  get userId(){return this.#userId;}

  /**
   * Identifies the group that the user is acting on behalf of.
   * @returns {GroupId}
   */
  get groupId(){return this.#groupId;}

  /**
   * The user's vcard.
   * @returns {IndividualVcard}
   */
  get userVcard(){return this.#userVcard;}

  /**
   * The group's vcard.
   * @returns {GroupVcard}
   */
  get groupVcard(){return this.#groupVcard;}

  /**
   * The roles the user has when using Qworum services on behalf of the group.
   * @returns {IRL[]}
   */
  get userRoleIds(){return [...this.#userRoleIds];}

  /**
   * Defines the set of roles that the user is allowed to have when acting on behalf of a group that is in a partnership. In other words, this is a mask for user's roles. This property is ignored if the group is not in a partnership.
   * @returns {IRL[]}
  */
  get groupRoleIds(){return [...this.#groupRoleIds];}

  /**
   * This flag is used by {@link Persona#hasRole} for deciding whether the user has a certain role, in cases where the outcome would have been undecidable otherwise, such as when the role belongs to an unknown roleset RS1 (i.e. when none of the roles in {@link Persona#userRoleIds} belong to RS1).
   * 
   * @returns {boolean}
  */
  get userHasAllRolesByDefault(){return this.#userHasAllRolesByDefault;}

  /**
   * This flag is used by {@link Persona#hasRole} for deciding whether the group has a certain role, in cases where the outcome would have been undecidable otherwise, such as when the role belongs to an unknown roleset RS1 (i.e. when none of the roles in {@link Persona#groupRoleIds} belong to RS1).
   * 
   * @returns {boolean}
  */
  get groupHasAllRolesByDefault(){return this.#groupHasAllRolesByDefault;}

  /**
   * The other groups whose data the user can access, within the restrictions of the user's roles. This set is empty if the user's group is not part of a partnership.
   * @returns {(GroupIdSet | null)}
   */
  get partnerGroupIds(){return this.#partnerGroupIds?.clone() ?? null;}

  /**
   * Creates a persona object.
   * @param {{groupId: GroupId, userId: UserId, userVcard: IndividualVcard, groupVcard: GroupVcard, userRoleIds: IRL[] | undefined, groupRoleIds: IRL[] | undefined, partnerGroupIds: GroupIdSet | undefined, userHasAllRolesByDefault: boolean | undefined, groupHasAllRolesByDefault: boolean | undefined}} persona 
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
    if (!persona.userRoleIds.every(role => role instanceof IRL)) {
      throw new TypeError('Not a user roles array');
    }
    if (!(persona.groupRoleIds instanceof Array)) persona.groupRoleIds = [];
    if (!persona.groupRoleIds.every(role => role instanceof IRL)) {
      throw new TypeError('Not a group roles array');
    }
    if (!(persona.partnerGroupIds === undefined || (persona.partnerGroupIds instanceof GroupIdSet && !persona.partnerGroupIds.isEmpty && !persona.partnerGroupIds.has(persona.groupId)))) {
      throw new TypeError("If a partner group is specified, then it must be a non-empty GroupIdSet that does not contain the persona's group");
    }

    if(!(
      persona.userHasAllRolesByDefault === undefined ||
      typeof persona.userHasAllRolesByDefault === 'boolean'
    ))
    throw new TypeError('Not valid user roles flag');

    if(!(
      persona.groupHasAllRolesByDefault === undefined ||
      typeof persona.groupHasAllRolesByDefault === 'boolean'
    ))
    throw new TypeError('Not valid group roles flag');

    persona.userRoleIds     = persona.userRoleIds ?? [];
    persona.groupRoleIds    = persona.groupRoleIds ?? [];

    this.#userId          = persona.userId;
    this.#groupId         = persona.groupId;
    this.#userVcard       = persona.userVcard;
    this.#groupVcard      = persona.groupVcard;
    this.#userRoleIds     = [...persona.userRoleIds];
    this.#groupRoleIds    = [...persona.groupRoleIds];
    this.#partnerGroupIds = persona.partnerGroupIds?.clone() ?? null;
    this.#groupHasAllRolesByDefault = (
      persona.groupHasAllRolesByDefault === undefined ? true : persona.groupHasAllRolesByDefault
    );
    this.#userHasAllRolesByDefault = (
      persona.userHasAllRolesByDefault === undefined ? true : persona.userHasAllRolesByDefault
    );
  }


  /*
  Role ids are IRLs or URLs, not URNs.

  All role ids in a roleset must have the same origin IRL/URL.

  If a user has no roles whose origin is the same as a roleset's origin, then
  by default the user has all of the roles defined in that roleset.
   */
  
  /**
   * Qworum services and applications should call this method to decide whether a persona has a certain role R1. If having another role R2 implies also having R1 (this is typically the case for rolesets with internal role hierarchies), then both roles should be passed as call arguments.
   * 
   * @param {...(IRL | URL | (IRL | URL)[])} roleIds 
   * @returns {boolean}
   * @throws {TypeError}
   */
  hasRole(...roleIds){
    roleIds = roleIds.flat(1);

    for (const roleId of roleIds) {
      if(![IRL, URL].find(c => roleId instanceof c)) throw new TypeError('not a role id');
      // console.debug(`[Persona#hasRole] checking roleId <${roleId}>`);

      const 
      originsAreEqual = (irlId, roleId) => (roleId instanceof URL ? irlId.url.origin === roleId.origin : irlId.origin === roleId.origin),
      roleIdsAreEqual = (irlId, roleId) => (roleId instanceof URL ? `${irlId.url}` === `${roleId}` : irlId.equals(roleId));

      let
      /** @type {boolean} */
      groupHasRole = true;

      // if group is not in a partnership, then it has all roles
      if(this.partnerGroupIds){
        // group is in a partnership

        if (!this.groupRoleIds.find(irl => roleIdsAreEqual(irl, roleId))) {
          // the group does have not the role
          
          if (this.groupRoleIds.find(irl => originsAreEqual(irl, roleId))) {
            // the group has another role in that roleset
            groupHasRole = false;
          } else {
            // the group has none of the roles in that roleset; the flag decides
            groupHasRole = this.groupHasAllRolesByDefault;
          }
        }
      } else {
        // console.debug(`[Persona#hasRole] group is not in a partnership`);
      }

      let
      /** @type {boolean} */
      userHasRole = true;

      if (!this.userRoleIds.find(irl => roleIdsAreEqual(irl, roleId))) {
        // the user does have not the role
        
        if (this.userRoleIds.find(irl => originsAreEqual(irl, roleId))) {
          // the user has another role in that roleset
          userHasRole = false;
        } else {
          // the user has none of the roles in that roleset; the flag decides
          userHasRole = this.userHasAllRolesByDefault;
        }
      } else {
        // console.debug(`[Persona#hasRole] user has the role in the group`);
      }

      if(groupHasRole && userHasRole)return true;
    }

    return false;
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
   * Writes a persona to an in-memory RDF dataset that conforms to the DatasetCore interface.
   * 
   * ⚠️ Warning: the persona must be the only data that is stored in the dataset.
   * 
   * @param {object} dataset 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
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

    for (const partnerGroupId of this.partnerGroupIds.members) {
      dataset.add(t.quad(personaTerm, partnerGroupPredicate, t.namedNode(`${partnerGroupId}`)));
    }

    dataset.add(
      t.quad(
        personaTerm, 
        t.namedNode(`${QRM}userHasAllRolesByDefault`), 
        t.literal(`${this.userHasAllRolesByDefault}`, t.namedNode(`${XSD}boolean`))
      )
    );

    dataset.add(
      t.quad(
        personaTerm, 
        t.namedNode(`${QRM}groupHasAllRolesByDefault`), 
        t.literal(`${this.groupHasAllRolesByDefault}`, t.namedNode(`${XSD}boolean`))
      )
    );
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Persona}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
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
      usersHaveAllRolesByDefaultDs = (
        dataset.match(null, t.namedNode(`${QRM}usersHaveAllRolesByDefault`))
      ),
      groupsHaveAllRolesByDefaultDs = (
        dataset.match(null, t.namedNode(`${QRM}groupsHaveAllRolesByDefault`))
      ),
      
      userRoleIds     = [],
      groupRoleIds    = [],
      partnerGroupIds = new GroupIdSet();

      for (const userRoleIdQuad of userRoleIdsDs) {
        userRoleIds.push(iri`${userRoleIdQuad.object.value}`)
      }

      for (const groupRoleIdQuad of groupRoleIdsDs) {
        groupRoleIds.push(iri`${groupRoleIdQuad.object.value}`)
      }

      for (const partnerGroupIdQuad of partnerGroupIdsDs) {
        partnerGroupIds.add(group_id`${partnerGroupIdQuad.object.value}`);
      }

      let 
      userHasAllRolesByDefault  = true,
      groupHasAllRolesByDefault = true;

      for (const usersHaveAllRolesByDefaultQuad of usersHaveAllRolesByDefaultDs) {
        userHasAllRolesByDefault = usersHaveAllRolesByDefaultQuad.object.value === 'true';
      }

      for (const groupsHaveAllRolesByDefaultQuad of groupsHaveAllRolesByDefaultDs) {
        groupHasAllRolesByDefault = groupsHaveAllRolesByDefaultQuad.object.value === 'true';
      }

      return new Persona({
        userId, groupId, userVcard, groupVcard, userRoleIds, groupRoleIds, partnerGroupIds,
        userHasAllRolesByDefault, groupHasAllRolesByDefault
      });

    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

}

export { Persona };
