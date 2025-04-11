import { rdfTerm as t } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { 
  OrgId, orgid, 
  GroupId, groupid,
  CollabId, collabid,
} from "./id.mjs";


/**
 * Represents an organisation. Has managers and members.
 * Can contain top-level groups. The members of each top-level group is a subset of the org members.
 * @see {@link https://datatracker.ietf.org/doc/html/rfc6350#section-6.1.4 | Vcard 4.0 specification}
 */
class Org {
  /** @type {OrgId} */ orgId;

  /**
   * 
   * @param {OrgId} orgId 
   */
  constructor(orgId) {
    this.orgId = orgId;
  }

  equals(other) {
    if (!(other instanceof Org)) return false;
    return this.orgId.equals(other.orgId);
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
      org    = new Org(orgid`${idTerm.value}`);

      res.push(org);
    }

    return res;
  }

  /**
   * 
   * @param {object} rdfDataset 
   */
  writeTo(rdfDataset){
    const idTerm = t.namedNode(`${this.orgId}`);

    rdfDataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`))
    );
  }

}


class Group {
  /** @type {GroupId} */ groupId;
  /** @type {boolean} */ isPersonalGroup;
  /** @type {(OrgId | undefined)} */ orgId;
  /** @type {(GroupId | undefined)} */ parentGroupId;
  /** @type {(CollabId | undefined)} */ collabId;

  /**
   * 
   * @param {{groupId: GroupId | undefined, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, collabId: CollabId | undefined}} group
   */
  constructor(group) {
    // TODO check args for group
    this.groupId         = group.groupId ?? GroupId.uuid();
    this.isPersonalGroup = group.isPersonalGroup;
    this.orgId           = group.orgId;
    this.parentGroupId   = group.parentGroupId;
    this.collabId        = group.collabId;
  }

  equals(other) {
    if (!(other instanceof Group)) return false;
    return this.groupId.equals(other.groupId);
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
      const
      idTerm               = idQuad.subject,
      groupId              = groupid`${idTerm.value}`,
      personalGroupDataset = rdfDataset.match(
        idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`)
      ),
      isPersonalGroup      = personalGroupDataset.size === 1,
      orgIdDataset         = rdfDataset.match(idTerm, t.namedNode(`${QRM}parentOrg`))  ,
      parentGroupIdDataset = rdfDataset.match(idTerm, t.namedNode(`${QRM}parentGroup`));

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

      const group = new Group({groupId, isPersonalGroup, orgId, parentGroupId});
      res.push(group);
    }

    return res;
  }

  /**
   * 
   * @param {object} rdfDataset 
   */
  writeTo(rdfDataset){
    const idTerm = t.namedNode(`${this.groupId}`);

    rdfDataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
    );
    if (this.isPersonalGroup) {
      rdfDataset.add(
        t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PersonalGroup`))
      );
    }
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
  }
}


class PersonalGroup extends Group {
  /**
   * 
   * @param {{groupId: GroupId, isPersonalGroup: boolean | undefined, orgId: OrgId | undefined, parentGroupId: GroupId | undefined, collabId: CollabId | undefined}} group
   * @throws {TypeError}
   */
  constructor(group) {
    super(group);
    if(!this.isPersonalGroup) throw new TypeError('Group is not personal');
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
      groupId        : group.groupId,
      isPersonalGroup: true,
      orgId          : group.orgId,
      parentGroupId  : group.parentGroupId
    }));

    return res;
  }
}


export {Org, Group, PersonalGroup};
