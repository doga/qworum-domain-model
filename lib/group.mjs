import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { 
  OrgId, org_id, 
  GroupId, group_id, baregroup_id,
  PartnershipId, partnership_id,
  UserId, user_id, UserIdSet,
} from "./id.mjs";


/**
 * Represents an organisation. Has managers and members.
 * Can contain top-level groups. The members of each top-level group is a subset of the org members.
 * @see {@link https://datatracker.ietf.org/doc/html/rfc6350#section-6.1.4 | Vcard 4.0 specification}
 */
class Org {
  /** 
   * Identifies the org. Cannot be changed after object creation.
   * @type {OrgId} 
   **/ 
  #orgId;

  /**
   * Manager role: owner.
   * @type {UserIdSet} 
   **/
  #ownerIds;

  /**
   * Manager role: Groups manager. Can create root groups.
   * @type {UserIdSet} 
   **/
  #groupsManagerIds;

  /**
   * Manager role: Memberships manager.
   * @type {UserIdSet} 
   **/
  #membershipsManagerIds;

  /**
   * Member role.
   * @type {UserIdSet} 
   **/
  #memberIds;

  /**
   * @returns {OrgId}
   */
  get orgId(){return this.#orgId;}

  /**
   * @returns {UserIdSet}
   */
  get ownerIds(){return this.#ownerIds;}

  /**
   * @returns {UserIdSet}
   */
  get groupsManagerIds(){return this.#groupsManagerIds;}

  /**
   * @returns {UserIdSet}
   */
  get membershipsManagerIds(){return this.#membershipsManagerIds;}

  /**
   * @returns {UserIdSet}
   */
  get memberIds(){return this.#memberIds;}

  /**
   * @returns {UserIdSet}
   */
  get managerIds(){
    return (
      this.groupsManagerIds
      .union(this.membershipsManagerIds)
    );
  }

  /**
   * Returns the set of all owners, managers and members
   * @returns {UserIdSet}
   */
  get participantIds(){
    return (
      this.ownerIds
      .union(this.managerIds)
      .union(this.memberIds)
    );
  }

  /**
   * 
   * @param {{orgId: OrgId | undefined, ownerIds: UserIdSet, groupsManagerIds: UserIdSet | undefined, membershipsManagerIds: UserIdSet | undefined, memberIds: UserIdSet | undefined }} org 
   * @throws {TypeError}
   */
  constructor(org) {
    if(!(
      org instanceof Object &&
      !(org instanceof Array)
    ))
    throw new TypeError('Bad arg');

    if(!(
      (!org.orgId || org.orgId instanceof OrgId)
    ))
    throw new TypeError('Not a valid org id');

    if(!(
      org.ownerIds instanceof UserIdSet &&
      !org.ownerIds.isEmpty
    ))
    throw new TypeError('Not valid owners');

    if(!(
      !org.groupsManagerIds ||
      org.groupsManagerIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid groups managers');

    if(!(
      !org.membershipsManagerIds ||
      org.membershipsManagerIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid memberships managers');

    if(!(
      !org.memberIds ||
      org.memberIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid members');

    org.groupsManagerIds      = org.groupsManagerIds ?? new UserIdSet();
    org.membershipsManagerIds = org.membershipsManagerIds ?? new UserIdSet();
    org.memberIds             = org.memberIds ?? new UserIdSet();

    this.#orgId                 = org.orgId ?? OrgId.uuid();
    this.#ownerIds              = org.ownerIds.clone();
    this.#groupsManagerIds      = org.groupsManagerIds.clone();
    this.#membershipsManagerIds = org.membershipsManagerIds.clone();
    this.#memberIds             = org.memberIds.clone();
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasOwners(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.ownerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasGroupsManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.groupsManagerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasMembershipsManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.membershipsManagerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.managerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasMembers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.memberIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasParticipants(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.participantIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Org)) return false;
    return this.orgId.equals(other.orgId);
  }

  /**
   * Writes this object to a new RDF dataset.
   * @returns {object} an RDF dataset
   * @throws {Error}
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
    const idTerm = t.namedNode(`${this.orgId}`);

    // type
    dataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`))
    );

    // managers
    for (const userId of this.ownerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.groupsManagerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}groupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}member`), t.namedNode(`${userId}`))
      );
    } 

  }

  /**
   * 
   * @param {object} dataset
   * @returns {Org[]}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    const 
    res = [],
    idsDataset = dataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`)
    );

    for (const idQuad of idsDataset) {
      const
      idTerm = idQuad.subject,
      orgId  = org_id`${idTerm.value}`;

      // managers
      const
      ownerIds              = new UserIdSet(),
      groupsManagerIds      = new UserIdSet(),
      membershipsManagerIds = new UserIdSet(),
      
      ownersDs              = dataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      groupsManagersDs  = dataset.match(idTerm, t.namedNode(`${QRM}groupsManager`)),
      membershipsManagersDs = dataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const quad of ownersDs) {
        const userIdTerm = quad.object;
        ownerIds.add(user_id`${userIdTerm.value}`);
      }
      for (const quad of groupsManagersDs) {
        const userIdTerm = quad.object;
        groupsManagerIds.add(user_id`${userIdTerm.value}`);
      }
      for (const quad of membershipsManagersDs) {
        const userIdTerm = quad.object;
        membershipsManagerIds.add(user_id`${userIdTerm.value}`);
      }
      
      // members
      const
      memberIds = new UserIdSet(),
      membersDs = dataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const quad of membersDs) {
        const userIdTerm = quad.object;
        memberIds.add(user_id`${userIdTerm.value}`);
      }

      // create org
      const org = new Org({orgId, ownerIds, groupsManagerIds, membershipsManagerIds, memberIds});
      res.push(org);
    }

    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(Org|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const orgs = Org.readFrom(dataset);
      if (orgs.length === 0) {
        return null;
      }
      return orgs[0];
    } catch (_error) {
      return null;
    }
  }

}


class Group {
  /** 
   * Identifies the group. Cannot be changed after object creation.
   * @type {GroupId} 
   **/ 
  #groupId;

  /** @type {boolean} */ 
  #isPersonalGroup;

  /** @type {(OrgId | undefined)} */ 
  #orgId;

  /** @type {(GroupId | undefined)} */ 
  #parentGroupId;

  /** 
   * Any partnership that this group may be involved in (at most one).
   * 
   * If this group is a partnership owner, then this field must point to it.
   * 
   * If a partnership wishes to have this group as a member (indicated by fact that
   * the partnership lists this group's id in its members list), then 
   * this group can accept the membership by pointing to the partnership with this field.
   * 
   * @type {(PartnershipId | undefined)} 
   **/
  #partnershipId;

  /**
   * Manager role: owner. Must not contain duplicate IDs (must be a set).
   * @type {UserIdSet} 
   **/
  #ownerIds;

  /**
   * Manager role: Subgroups manager.  Must not contain duplicate IDs (must be a set).
   * @type {UserIdSet} 
   **/
  #subgroupsManagerIds;

  /**
   * Manager role: Partnerships manager.  Must not contain duplicate IDs (must be a set).
   * @type {UserIdSet} 
   **/
  #partnershipsManagerIds;

  /**
   * Manager role: Memberships manager.  Must not contain duplicate IDs (must be a set).
   * @type {UserIdSet} 
   **/
  #membershipsManagerIds;

  /**
   * Member role. Must not contain duplicate IDs (must be a set).
   * @type {UserIdSet} 
   **/
  #memberIds;

  /**
   * @returns {GroupId}
   */
  get groupId(){return this.#groupId;}

  /**
   * @returns {boolean}
   */
  get isPersonalGroup(){return this.#isPersonalGroup;}

  /**
   * @returns {OrgId}
   */
  get orgId(){return this.#orgId;}

  /**
   * @returns {GroupId}
   */
  get parentGroupId(){return this.#parentGroupId;}

  /**
   * @returns {PartnershipId}
   */
  get partnershipId(){return this.#partnershipId;}

  /**
   * @param {PartnershipId} value
   */
  set partnershipId(value){
    if(value instanceof PartnershipId) 
      this.#partnershipId = value;
  }

  /**
   * @returns {UserIdSet}
   */
  get ownerIds(){return this.#ownerIds;}

  /**
   * @returns {UserIdSet}
   */
  get subgroupsManagerIds(){return this.#subgroupsManagerIds;}

  /**
   * @returns {UserIdSet}
   */
  get partnershipsManagerIds(){return this.#partnershipsManagerIds;}

  /**
   * @returns {UserIdSet}
   */
  get membershipsManagerIds(){return this.#membershipsManagerIds;}

  /**
   * @returns {UserIdSet}
   */
  get memberIds(){return this.#memberIds;}

  /**
   * @returns {UserIdSet}
   */
  get managerIds(){
    return (
      this.subgroupsManagerIds
      .union(this.partnershipsManagerIds)
      .union(this.membershipsManagerIds)
    );
  }

  /**
   * Returns the set of all owners, managers and members
   * @returns {UserIdSet}
   */
  get participantIds(){
    return (
      this.ownerIds
      .union(this.managerIds)
      .union(this.memberIds)
    );
  }

  /**
   * Creates a group in memory. 
   * 
   * For personal groups, the ownerIds array must contain one UserId and isPersonalGroup must be
   * truthy and these fields must be omitted: orgId, parentGroupId, subgroupsManagerIds.
   * If these fields are omitted for personal group, then will be set to ownerIds: 
   * partnershipsManagerIds, membershipsManagerIds.
   * 
   * @param {{groupId: GroupId | undefined, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, partnershipId: PartnershipId | undefined, ownerIds: UserIdSet, subgroupsManagerIds: UserIdSet | undefined, partnershipsManagerIds: UserIdSet | undefined, membershipsManagerIds: UserIdSet | undefined, memberIds: UserIdSet | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    if(!(
      group instanceof Object &&
      !(group instanceof Array)
    ))
    throw new TypeError('Bad arg');

    if(!(
      (!group.orgId || group.orgId instanceof OrgId)
    ))
    throw new TypeError('Not a valid org');
    
    if(!(
      (!group.partnershipId || group.partnershipId instanceof PartnershipId)
    ))
    throw new TypeError('Not a valid partnership');
    
    if(!(
      (!group.parentGroupId || group.parentGroupId instanceof GroupId)
    ))
    throw new TypeError('Not a valid parent group');
    
    if(!(
      group.ownerIds instanceof UserIdSet &&
      !group.ownerIds.isEmpty
    ))
    throw new TypeError('Not valid owners');
    
    if(!(
      !group.subgroupsManagerIds || group.subgroupsManagerIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid subgroup managers');
    
    if(!(
      !group.partnershipsManagerIds || group.partnershipsManagerIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid partnerships managers');
    
    if(!(
      !group.membershipsManagerIds || group.membershipsManagerIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid memberships managers');
    
    if(!(
      !group.memberIds || group.memberIds instanceof UserIdSet
    ))
    throw new TypeError('Not valid members');
    
    if (group.isPersonalGroup) {
      if (group.ownerIds.size !== 1) {
        throw new TypeError('Personal group must have exactly one owner');
      }
      if (group.memberIds) {
        if (!group.memberIds.isSupersetOf(group.ownerIds)) {
          console.debug(`[Group init] group.memberIds`,group.memberIds.members);
          console.debug(`[Group init] group.ownerIds`,group.ownerIds.members);
          throw new TypeError('Personal group must have the owner amongst its members');
        }
      } else {
        group.memberIds = group.ownerIds.clone();
      }
      if (group.orgId) {
        throw new TypeError('Personal group must not be part of an org');
      }
      if (group.parentGroupId) {
        throw new TypeError('Personal group must not have a parent group');
      }
      if (group.subgroupsManagerIds && !group.subgroupsManagerIds.isEmpty) {
        throw new TypeError('Personal group must not have subgroup managers');
      }
      if (!group.partnershipsManagerIds) {
        group.partnershipsManagerIds = group.ownerIds.clone();
      }
      if (!group.membershipsManagerIds) {
        group.membershipsManagerIds = group.ownerIds.clone();
      }
    }

    group.subgroupsManagerIds    = group.subgroupsManagerIds ?? new UserIdSet();
    group.partnershipsManagerIds = group.partnershipsManagerIds ?? new UserIdSet();
    group.membershipsManagerIds  = group.membershipsManagerIds ?? new UserIdSet();
    group.memberIds              = group.memberIds ?? new UserIdSet();

    this.#groupId         = group.groupId ?? GroupId.uuid();
    this.#isPersonalGroup = group.isPersonalGroup ? true : false;

    this.#orgId         = group.orgId;
    this.#parentGroupId = group.parentGroupId;
    this.#partnershipId  = group.partnershipId;

    this.#ownerIds               = group.ownerIds.clone();
    this.#subgroupsManagerIds    = group.subgroupsManagerIds.clone();
    this.#partnershipsManagerIds = group.partnershipsManagerIds.clone();
    this.#membershipsManagerIds  = group.membershipsManagerIds.clone();
    this.#memberIds              = group.memberIds.clone();
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasOwners(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.ownerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasSubgroupsManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.subgroupsManagerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasPartnershipManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.partnershipsManagerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasMembershipsManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.membershipsManagerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasManagers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.managerIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasMembers(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.memberIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(UserId | UserIdSet)} userIds
   * @returns {boolean}
   */
  hasParticipants(userIds) {
    if (userIds instanceof UserId) userIds = new UserIdSet().add(userIds);
    for (const userId of userIds.members) {
      if(!this.participantIds.has(userId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Group)) return false;
    return this.groupId.equals(other.groupId);
  }

  /**
   * Writes this object to a new RDF dataset.
   * @returns {object} an RDF dataset
   * @throws {Error}
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
    const idTerm = t.namedNode(`${this.groupId}`);

    // group type
    dataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
    );
    if (this.isPersonalGroup) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`))
      );
    }

    // group hierarchy
    if (this.orgId) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}parentOrg`), t.namedNode(`${this.orgId}`))
      );
    }
    if (this.parentGroupId) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}parentGroup`), t.namedNode(`${this.parentGroupId}`))
      );
    }

    // partnership
    if (this.partnershipId) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}partnership`), t.namedNode(`${this.partnershipId}`))
      );
    }

    // managers
    for (const userId of this.ownerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.subgroupsManagerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}subgroupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.partnershipsManagerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}partnershipsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds.members) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}member`), t.namedNode(`${userId}`))
      );
    }

  }

  /**
   * 
   * @param {object} dataset
   * @returns {Group[]}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    const 
    res = [],
    idsDataset = dataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`)
    );

    for (const idQuad of idsDataset) {
      // group type
      const
      idTerm          = idQuad.subject,
      groupId         = group_id`${idTerm.value}`,
      personalGroupDs = dataset.match(
        idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`)
      ),
      isPersonalGroup = personalGroupDs.size === 1,
      orgIdDs         = dataset.match(idTerm, t.namedNode(`${QRM}parentOrg`))  ,
      partnershipIdDs = dataset.match(idTerm, t.namedNode(`${QRM}partnership`))  ,
      parentGroupIdDs = dataset.match(idTerm, t.namedNode(`${QRM}parentGroup`));

      // group hierarchy and partnership
      let orgIdTerm, parentGroupIdTerm, partnershipTerm;
      for (const quad of orgIdDs) {
        orgIdTerm = quad.object;
      }
      for (const quad of parentGroupIdDs) {
        parentGroupIdTerm = quad.object;
      }
      for (const quad of partnershipIdDs) {
        partnershipTerm = quad.object;
      }
      let orgId, parentGroupId, partnershipId;
      if (orgIdTerm) {
        orgId = org_id`${orgIdTerm.value}`;
      }
      if (parentGroupIdTerm) {
        parentGroupId = group_id`${parentGroupIdTerm.value}`;
      }
      if (partnershipTerm) {
        partnershipId = partnership_id`${partnershipTerm.value}`;
      }

      // managers
      const
      ownerIds               = new UserIdSet(),
      subgroupsManagerIds    = new UserIdSet(),
      partnershipsManagerIds = new UserIdSet(),
      membershipsManagerIds  = new UserIdSet(),
      
      ownersDs                 = dataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      subgroupsManagerIdsDs    = dataset.match(idTerm, t.namedNode(`${QRM}subgroupsManager`)),
      partnershipsManagerIdsDs = dataset.match(idTerm, t.namedNode(`${QRM}partnershipsManager`)),
      membershipsManagerIdsDs  = dataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const ownerIdQuad of ownersDs) {
        const ownerIdTerm = ownerIdQuad.object;
        ownerIds.add(user_id`${ownerIdTerm.value}`);
      }
      for (const subgroupsManagerIdQuad of subgroupsManagerIdsDs) {
        const subgroupsManagerIdTerm = subgroupsManagerIdQuad.object;
        subgroupsManagerIds.add(user_id`${subgroupsManagerIdTerm.value}`);
      }
      for (const partnershipManagerIdQuad of partnershipsManagerIdsDs) {
        const partnershipManagerIdTerm = partnershipManagerIdQuad.object;
        partnershipsManagerIds.add(user_id`${partnershipManagerIdTerm.value}`);
      }
      for (const membershipsManagerIdQuad of membershipsManagerIdsDs) {
        const membershipsManagerIdTerm = membershipsManagerIdQuad.object;
        membershipsManagerIds.add(user_id`${membershipsManagerIdTerm.value}`);
      }
      
      // members
      const
      memberIds = new UserIdSet(),
      membersDs = dataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const memberIdQuad of membersDs) {
        const memberIdTerm = memberIdQuad.object;
        memberIds.add(user_id`${memberIdTerm.value}`);
      }

      // create group
      const group = new Group({groupId, isPersonalGroup, orgId, parentGroupId, partnershipId, ownerIds, subgroupsManagerIds, partnershipsManagerIds, membershipsManagerIds, memberIds});
      res.push(group);
    }

    return res;
  }


  /**
   * 
   * @param {object} dataset 
   * @returns {(Group|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const groups = Group.readFrom(dataset);
      if (groups.length === 0) {
        return null;
      }
      return groups[0];
    } catch (error) {
      // console.debug(`[Group.readOneFrom] ${error}`);
      return null;
    }
  }

}

/**
 * Personal groups are groups that have only one owner.
 * These groups are created at the time of user account creation.
 * They don't belong to an org, and they don't have subgroups or a parent group.
 * Personal groups have the same bare IDs as their owners.
 * A user account has exactly one personal account.
 */
class PersonalGroup extends Group {
  // TODO get ownerId()
  /**
   * 
   * @param {{groupId: GroupId | undefined, ownerId: UserId, partnershipId: PartnershipId | undefined, partnershipsManagerIds: UserIdSet | undefined, membershipsManagerIds: UserIdSet | undefined, memberIds: UserIdSet | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    try {
      if (!group.memberIds) {
        group.memberIds = new UserIdSet().add(group.ownerId);
      }
      super({
        isPersonalGroup       : true,
        groupId               : group.groupId ?? baregroup_id`${group.ownerId.bareId}`,
        partnershipId         : group.partnershipId,
        ownerIds              : new UserIdSet().add(group.ownerId),
        partnershipsManagerIds: new UserIdSet().add(group.partnershipsManagerIds),
        membershipsManagerIds : new UserIdSet().add(group.membershipsManagerIds),
        memberIds             : new UserIdSet().add(group.memberIds),
      });
    } catch (error) {
      console.debug(`[PersonalGroup new] ${error}`);
      throw new TypeError(`${error}`);
    }
  }

  /**
   * Creates a user's personal group.
   * @param {{ownerId: UserId}} group
   * @throws {TypeError}
   */
  static create(group){
    try {
      return new PersonalGroup({
        ownerId               : group.ownerId,
        partnershipsManagerIds: new UserIdSet().add(group.ownerId),
        membershipsManagerIds : new UserIdSet().add(group.ownerId),
        memberIds             : new UserIdSet().add(group.ownerId),
      });
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {object} dataset
   * @returns {PersonalGroup[]}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    const 
    groups = super.readFrom(dataset),
    res = groups
    .filter(group => group.isPersonalGroup)
    .map(group => new PersonalGroup({
      groupId               : group.groupId,
      ownerId               : group.ownerIds.members[0],
      partnershipsManagerIds: group.partnershipsManagerIds,
      membershipsManagerIds : group.membershipsManagerIds,
      partnershipId         : group.partnershipId,
      memberIds             : group.memberIds,
    }));

    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(PersonalGroup|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const personalGroups = PersonalGroup.readFrom(dataset);
      if (personalGroups.length === 0) {
        return null;
      }
      return personalGroups[0];
    } catch (_error) {
      return null;
    }
  }

}


export {Org, Group, PersonalGroup};
