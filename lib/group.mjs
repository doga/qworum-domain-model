import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { 
  OrgId, org_id, 
  GroupId, group_id, baregroup_id,
  PartnershipId, partnership_id,
  UserId, user_id,
} from "./id.mjs";


/**
 * Represents an organisation. Has managers and members.
 * Can contain top-level groups. The members of each top-level group is a subset of the org members.
 * @see {@link https://datatracker.ietf.org/doc/html/rfc6350#section-6.1.4 | Vcard 4.0 specification}
 */
class Org {
  /** @type {OrgId} */ orgId;
  /**
   * Manager role: owner. 
   * @type {UserId[]} 
   **/
  ownerIds;
  /**
   * Manager role: Root groups manager. 
   * @type {UserId[]} 
   **/
  rootGroupsManagerIds;
  /**
   * Manager role: Memberships manager. 
   * @type {UserId[]} 
   **/
  membershipsManagerIds;
  /**
   * Member role. 
   * @type {UserId[]} 
   **/
  memberIds;

  /**
   * 
   * @param {{orgId: OrgId | undefined, ownerIds: UserId[], rootGroupsManagerIds: UserId[] | undefined, membershipsManagerIds: UserId[] | undefined, memberIds: UserId[] | undefined }} org 
   */
  constructor(org) {
    this.orgId                 = org.orgId ?? OrgId.uuid();
    this.ownerIds              = org.ownerIds;
    this.rootGroupsManagerIds  = org.rootGroupsManagerIds;
    this.membershipsManagerIds = org.membershipsManagerIds;
    this.memberIds             = org.memberIds;
  }

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
    for (const userId of this.ownerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.rootGroupsManagerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}rootGroupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds) {
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
      ownerIds              = [],
      rootGroupsManagerIds  = [],
      membershipsManagerIds = [],
      
      ownersDs              = dataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      rootGroupsManagersDs  = dataset.match(idTerm, t.namedNode(`${QRM}rootGroupsManager`)),
      membershipsManagersDs = dataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const quad of ownersDs) {
        const userIdTerm = quad.object;
        ownerIds.push(user_id`${userIdTerm.value}`);
      }
      for (const quad of rootGroupsManagersDs) {
        const userIdTerm = quad.object;
        rootGroupsManagerIds.push(user_id`${userIdTerm.value}`);
      }
      for (const quad of membershipsManagersDs) {
        const userIdTerm = quad.object;
        membershipsManagerIds.push(user_id`${userIdTerm.value}`);
      }
      
      // members
      const
      memberIds = [],
      membersDs = dataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const quad of membersDs) {
        const userIdTerm = quad.object;
        memberIds.push(user_id`${userIdTerm.value}`);
      }

      // create org
      const org = new Org({orgId, ownerIds, rootGroupsManagerIds, membershipsManagerIds, memberIds});
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


class Group { // BUG personal group semantics are not enforced (parent group can be set for personal group, etc )
  /** @type {GroupId} */ groupId;
  /** @type {boolean} */ isPersonalGroup;
  /** @type {(OrgId | undefined)} */ orgId;
  /** @type {(GroupId | undefined)} */ parentGroupId;
  /** @type {PartnershipId[]} */ partnershipIds;
  /**
   * Manager role: owner. 
   * @type {UserId[]} 
   **/
  ownerIds;
  /**
   * Manager role: Subgroups manager. 
   * @type {UserId[]} 
   **/
  subgroupsManagerIds;
  /**
   * Manager role: Partnerships manager. 
   * @type {UserId[]} 
   **/
  partnershipsManagerIds;
  /**
   * Manager role: Memberships manager. 
   * @type {UserId[]} 
   **/
  membershipsManagerIds;
  /**
   * Member role. 
   * @type {UserId[]} 
   **/
  memberIds;

  /**
   * Creates a group in memory. 
   * 
   * For personal groups, the ownerIds array must contain one UserId and isPersonalGroup must be
   * truthy and these fields must be omitted: orgId, parentGroupId, subgroupsManagerIds.
   * If these fields are omitted for personal group, then will be set to ownerIds: 
   * partnershipsManagerIds, membershipsManagerIds.
   * 
   * @param {{groupId: GroupId | undefined, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, partnershipIds: PartnershipId[] | undefined, ownerIds: UserId[], subgroupsManagerIds: UserId[] | undefined, partnershipsManagerIds: UserId[] | undefined, membershipsManagerIds: UserId[] | undefined, memberIds: UserId[] | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    if(!(
      (!group.orgId || group.orgId instanceof OrgId)
    ))
    throw new TypeError('Not a valid org');
    
    if(!(
      (!group.parentGroupId || group.parentGroupId instanceof GroupId)
    ))
    throw new TypeError('Not a valid parent group');
    
    if(!(
      (!group.partnershipIds || (group.partnershipIds instanceof Array && group.partnershipIds.every(id => id instanceof PartnershipId)))
    ))
    throw new TypeError('Not valid partnerships');
    
    if(!(
      group.ownerIds instanceof Array && group.ownerIds.length > 0 && group.ownerIds.every(id => id instanceof UserId)
    ))
    throw new TypeError('Not valid owners');
    
    if(!(
      (!group.subgroupsManagerIds || (group.subgroupsManagerIds instanceof Array && group.subgroupsManagerIds.every(id => id instanceof UserId)))
    ))
    throw new TypeError('Not valid subgroup managers');
    
    if(!(
      (!group.partnershipsManagerIds || (group.partnershipsManagerIds instanceof Array && group.partnershipsManagerIds.every(id => id instanceof UserId)))
    ))
    throw new TypeError('Not valid partnerships managers');
    
    if(!(
      (!group.membershipsManagerIds || (group.membershipsManagerIds instanceof Array && group.membershipsManagerIds.every(id => id instanceof UserId)))
    ))
    throw new TypeError('Not valid memberships managers');
    
    if(!(
      (!group.memberIds || (group.memberIds instanceof Array && group.memberIds.every(id => id instanceof UserId)))
    ))
    throw new TypeError('Not a valid members');
    
    if (group.isPersonalGroup) {
      if (group.ownerIds.length !== 1) {
        throw new TypeError('Personal group must have exactly one owner');
      }
      if (group.memberIds) {
        if (!group.memberIds.find(id => id.equals(group.ownerIds[0]))) {
          throw new TypeError('Personal group must have the owner amongst its members');
        }
      } else {
        group.memberIds = group.ownerIds.filter(id => id instanceof UserId);
      }
      if (group.orgId) {
        throw new TypeError('Personal group must not be part of an org');
      }
      if (group.parentGroupId) {
        throw new TypeError('Personal group must not have a parent group');
      }
      if (group.subgroupsManagerIds && group.subgroupsManagerIds.length > 0) {
        throw new TypeError('Personal group must not have subgroup managers');
      }
      if (!group.partnershipsManagerIds) {
        group.partnershipsManagerIds = group.ownerIds.filter(id => id instanceof UserId);
      }
      if (!group.membershipsManagerIds) {
        group.membershipsManagerIds = group.ownerIds.filter(id => id instanceof UserId);
      }
    }

    this.groupId         = group.groupId ?? GroupId.uuid();
    this.isPersonalGroup = group.isPersonalGroup ? true : false;

    this.orgId         = group.orgId;
    this.parentGroupId = group.parentGroupId;
    this.partnershipIds = group.partnershipIds ?? [];

    this.ownerIds              = group.ownerIds;
    this.subgroupsManagerIds   = group.subgroupsManagerIds ?? [];
    this.partnershipsManagerIds = group.partnershipsManagerIds ?? [];
    this.membershipsManagerIds = group.membershipsManagerIds ?? [];

    this.memberIds = group.memberIds ?? [];
  }

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

    // managers
    for (const userId of this.ownerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.subgroupsManagerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}subgroupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.partnershipsManagerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}partnershipsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds) {
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds) {
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
      idTerm               = idQuad.subject,
      groupId              = group_id`${idTerm.value}`,
      personalGroupDataset = dataset.match(
        idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`)
      ),
      isPersonalGroup      = personalGroupDataset.size === 1,
      orgIdDataset         = dataset.match(idTerm, t.namedNode(`${QRM}parentOrg`))  ,
      parentGroupIdDataset = dataset.match(idTerm, t.namedNode(`${QRM}parentGroup`));

      // group hierarchy
      let orgIdTerm, parentGroupIdTerm;
      for (const orgIdQuad of orgIdDataset) {
        orgIdTerm = orgIdQuad.object;
      }
      for (const parentGroupIdQuad of parentGroupIdDataset) {
        parentGroupIdTerm = parentGroupIdQuad.object;
      }
      let orgId, parentGroupId;
      if (orgIdTerm) {
        orgId = org_id`${orgIdTerm.value}`;
      }
      if (parentGroupIdTerm) {
        parentGroupId = group_id`${parentGroupIdTerm.value}`;
      }

      // managers
      const
      ownerIds              = [],
      subgroupsManagerIds   = [],
      partnershipsManagerIds = [],
      membershipsManagerIds = [],
      
      ownersDs      = dataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      subgroupsDs   = dataset.match(idTerm, t.namedNode(`${QRM}subgroupsManager`)),
      partnershipsDs = dataset.match(idTerm, t.namedNode(`${QRM}partnershipsManager`)),
      membershipsDs = dataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const ownerIdQuad of ownersDs) {
        const ownerIdTerm = ownerIdQuad.object;
        ownerIds.push(user_id`${ownerIdTerm.value}`);
      }
      for (const subgroupsManagerIdQuad of subgroupsDs) {
        const subgroupsManagerIdTerm = subgroupsManagerIdQuad.object;
        subgroupsManagerIds.push(user_id`${subgroupsManagerIdTerm.value}`);
      }
      for (const partnershipManagerIdQuad of partnershipsDs) {
        const partnershipManagerIdTerm = partnershipManagerIdQuad.object;
        partnershipsManagerIds.push(user_id`${partnershipManagerIdTerm.value}`);
      }
      for (const membershipsManagerIdQuad of membershipsDs) {
        const membershipsManagerIdTerm = membershipsManagerIdQuad.object;
        membershipsManagerIds.push(user_id`${membershipsManagerIdTerm.value}`);
      }
      
      // members
      const
      memberIds      = [],
      membersDs = dataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const memberIdQuad of membersDs) {
        const memberIdTerm = memberIdQuad.object;
        memberIds.push(user_id`${memberIdTerm.value}`);
      }

      // create group
      const group = new Group({groupId, isPersonalGroup, orgId, parentGroupId, ownerIds, subgroupsManagerIds, partnershipsManagerIds, membershipsManagerIds, memberIds});
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
    } catch (_error) {
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
  /**
   * 
   * @param {{groupId: GroupId | undefined, ownerId: UserId, partnershipIds: PartnershipId[] | undefined, partnershipsManagerIds: UserId[] | undefined, membershipsManagerIds: UserId[] | undefined, memberIds: UserId[] | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    try {
      super({
        isPersonalGroup       : true,
        groupId               : group.groupId ?? baregroup_id`${group.ownerId.bareId}`,
        ownerIds              : [group.ownerId],
        partnershipsManagerIds: group.partnershipsManagerIds,
        membershipsManagerIds : group.membershipsManagerIds,
        partnershipIds        : group.partnershipIds,
        memberIds             : group.memberIds,
      });
    } catch (error) {
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
        partnershipsManagerIds: [group.ownerId],
        membershipsManagerIds : [group.ownerId],
        memberIds             : [group.ownerId],
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
      ownerId              : group.ownerIds[0],
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
