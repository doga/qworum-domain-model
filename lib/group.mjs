import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { 
  OrgId, orgid, 
  GroupId, groupid,
  CollabId, collabid,
  UserId, userid,
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
   * @param {object} rdfDataset 
   */
  writeTo(rdfDataset){
    const idTerm = t.namedNode(`${this.orgId}`);

    // type
    rdfDataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`))
    );

    // managers
    for (const userId of this.ownerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.rootGroupsManagerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}rootGroupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}member`), t.namedNode(`${userId}`))
      );
    } 

  }

  /**
   * 
   * @param {object} rdfDataset
   * @returns {Org[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    res = [],
    idsDataset = rdfDataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`)
    );

    for (const idQuad of idsDataset) {
      const
      idTerm = idQuad.subject,
      orgId  = orgid`${idTerm.value}`;

      // managers
      const
      ownerIds              = [],
      rootGroupsManagerIds  = [],
      membershipsManagerIds = [],
      
      ownersDs              = rdfDataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      rootGroupsManagersDs  = rdfDataset.match(idTerm, t.namedNode(`${QRM}rootGroupsManager`)),
      membershipsManagersDs = rdfDataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const quad of ownersDs) {
        const userIdTerm = quad.object;
        ownerIds.push(userid`${userIdTerm.value}`);
      }
      for (const quad of rootGroupsManagersDs) {
        const userIdTerm = quad.object;
        rootGroupsManagerIds.push(userid`${userIdTerm.value}`);
      }
      for (const quad of membershipsManagersDs) {
        const userIdTerm = quad.object;
        membershipsManagerIds.push(userid`${userIdTerm.value}`);
      }
      
      // members
      const
      memberIds = [],
      membersDs = rdfDataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const quad of membersDs) {
        const userIdTerm = quad.object;
        memberIds.push(userid`${userIdTerm.value}`);
      }

      // create org
      const org = new Org({orgId, ownerIds, rootGroupsManagerIds, membershipsManagerIds, memberIds});
      res.push(org);
    }

    return res;
  }

}


class Group {
  /** @type {GroupId} */ groupId;
  /** @type {boolean} */ isPersonalGroup;
  /** @type {(OrgId | undefined)} */ orgId;
  /** @type {(GroupId | undefined)} */ parentGroupId;
  /** @type {(CollabId | undefined)} */ collabId;
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
   * Manager role: Collab manager. 
   * @type {UserId[]} 
   **/
  collabManagerIds;
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
   * @param {{groupId: GroupId | undefined, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, collabId: CollabId | undefined, ownerIds: UserId[], subgroupsManagerIds: UserId[] | undefined, collabManagerIds: UserId[] | undefined, membershipsManagerIds: UserId[] | undefined, memberIds: UserId[] | undefined}} group
   */
  constructor(group) {
    if(!(
      (!group.orgId || group.orgId instanceof OrgId) &&

      (!group.parentGroupId || group.parentGroupId instanceof GroupId) &&

      (!group.collabId || group.collabId instanceof CollabId) &&

      group.ownerIds instanceof Array && group.ownerIds.length > 0 && group.ownerIds.every(id => id instanceof UserId) &&

      (!group.subgroupsManagerIds || (group.subgroupsManagerIds instanceof Array && group.subgroupsManagerIds.every(id => id instanceof UserId))) &&

      (!group.collabManagerIds || (group.collabManagerIds instanceof Array && group.collabManagerIds.every(id => id instanceof UserId))) &&

      (!group.membershipsManagerIds || (group.membershipsManagerIds instanceof Array && group.membershipsManagerIds.every(id => id instanceof UserId))) &&

      (!group.memberIds || (group.memberIds instanceof Array && group.memberIds.every(id => id instanceof UserId)))
    )) throw new TypeError('Not a valid group');

    this.groupId               = group.groupId ?? GroupId.uuid();
    this.isPersonalGroup       = group.isPersonalGroup;

    this.orgId                 = group.orgId;
    this.parentGroupId         = group.parentGroupId;
    this.collabId              = group.collabId;

    this.ownerIds              = group.ownerIds;
    this.subgroupsManagerIds   = group.subgroupsManagerIds ?? [];
    this.collabManagerIds      = group.collabManagerIds ?? [];
    this.membershipsManagerIds = group.membershipsManagerIds ?? [];

    this.memberIds             = group.memberIds ?? [];
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
   * @param {object} rdfDataset 
   */
  writeTo(rdfDataset){
    const idTerm = t.namedNode(`${this.groupId}`);

    // group type
    rdfDataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
    );
    if (this.isPersonalGroup) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`))
      );
    }

    // group hierarchy
    if (this.orgId) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}parentOrg`), t.namedNode(`${this.orgId}`))
      );
    }
    if (this.parentGroupId) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}parentGroup`), t.namedNode(`${this.parentGroupId}`))
      );
    }

    // managers
    for (const userId of this.ownerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}owner`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.subgroupsManagerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}subgroupsManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.collabManagerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}collabManager`), t.namedNode(`${userId}`))
      );
    }
    for (const userId of this.membershipsManagerIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}membershipsManager`), t.namedNode(`${userId}`))
      );
    }

    // members
    for (const userId of this.memberIds) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}member`), t.namedNode(`${userId}`))
      );
    }

  }

  /**
   * 
   * @param {object} rdfDataset
   * @returns {Group[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    res = [],
    idsDataset = rdfDataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`)
    );

    for (const idQuad of idsDataset) {
      // group type
      const
      idTerm               = idQuad.subject,
      groupId              = groupid`${idTerm.value}`,
      personalGroupDataset = rdfDataset.match(
        idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`)
      ),
      isPersonalGroup      = personalGroupDataset.size === 1,
      orgIdDataset         = rdfDataset.match(idTerm, t.namedNode(`${QRM}parentOrg`))  ,
      parentGroupIdDataset = rdfDataset.match(idTerm, t.namedNode(`${QRM}parentGroup`));

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
        orgId = orgid`${orgIdTerm.value}`;
      }
      if (parentGroupIdTerm) {
        parentGroupId = groupid`${parentGroupIdTerm.value}`;
      }

      // managers
      const
      ownerIds              = [],
      subgroupsManagerIds   = [],
      collabManagerIds      = [],
      membershipsManagerIds = [],
      
      ownersDataset      = rdfDataset.match(idTerm, t.namedNode(`${QRM}owner`)),
      subgroupsDataset   = rdfDataset.match(idTerm, t.namedNode(`${QRM}subgroupsManager`)),
      collabDataset      = rdfDataset.match(idTerm, t.namedNode(`${QRM}collabManager`)),
      membershipsDataset = rdfDataset.match(idTerm, t.namedNode(`${QRM}membershipsManager`));

      for (const ownerIdQuad of ownersDataset) {
        const ownerIdTerm = ownerIdQuad.object;
        ownerIds.push(userid`${ownerIdTerm.value}`);
      }
      for (const subgroupsManagerIdQuad of subgroupsDataset) {
        const subgroupsManagerIdTerm = subgroupsManagerIdQuad.object;
        subgroupsManagerIds.push(userid`${subgroupsManagerIdTerm.value}`);
      }
      for (const collabManagerIdQuad of collabDataset) {
        const collabManagerIdTerm = collabManagerIdQuad.object;
        collabManagerIds.push(userid`${collabManagerIdTerm.value}`);
      }
      for (const membershipsManagerIdQuad of membershipsDataset) {
        const membershipsManagerIdTerm = membershipsManagerIdQuad.object;
        membershipsManagerIds.push(userid`${membershipsManagerIdTerm.value}`);
      }
      
      // members
      const
      memberIds      = [],
      membersDataset = rdfDataset.match(idTerm, t.namedNode(`${QRM}member`));

      for (const memberIdQuad of membersDataset) {
        const memberIdTerm = memberIdQuad.object;
        memberIds.push(userid`${memberIdTerm.value}`);
      }

      // create group
      const group = new Group({groupId, isPersonalGroup, orgId, parentGroupId, ownerIds, subgroupsManagerIds, collabManagerIds, membershipsManagerIds, memberIds});
      res.push(group);
    }

    return res;
  }

}


class PersonalGroup extends Group {
  /**
   * 
   * @param {{groupId: GroupId | undefined, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, collabId: CollabId | undefined, ownerIds: UserId[], subgroupsManagerIds: UserId[] | undefined, collabManagerIds: UserId[] | undefined, membershipsManagerIds: UserId[] | undefined, memberIds: UserId[] | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    super(group);
    if(!(
      this.isPersonalGroup &&
      !this.orgId &&
      !this.parentGroupId  &&
      this.ownerIds.length === 1 &&
      this.subgroupsManagerIds.length === 0 
    )) throw new TypeError('not a personal group');
  }

  /**
   * 
   * @param {object} rdfDataset
   * @returns {PersonalGroup[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    groups = super.readFrom(rdfDataset),
    res = groups
    .filter(group => group.isPersonalGroup)
    .map(group => new PersonalGroup({
      groupId              : group.groupId,
      isPersonalGroup      : true,

      orgId                : group.orgId,
      parentGroupId        : group.parentGroupId,

      collabId             : group.collabId,
      ownerIds             : group.ownerIds,
      subgroupsManagerIds  : group.subgroupsManagerIds,
      collabManagerIds     : group.collabManagerIds,
      membershipsManagerIds: group.membershipsManagerIds,

      memberIds            : group.memberIds,
    }));

    return res;
  }
}


export {Org, Group, PersonalGroup};
