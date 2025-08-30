// RDF
import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF, XSD } from "./util/rdf-prefixes.mjs";

import { 
  GroupId, PartnershipId, 
  group_id, partnership_id, 
  baregroup_id, barepartnership_id,
  GroupIdSet 
} from "./id.mjs";


class Partnership {
  /** 
   * Identifies the partnership. Cannot be changed after object creation.
   * @type {PartnershipId}
   **/ #partnershipId;

  /** 
   * The group that has created the partnership. Cannot be changed after object creation.
   * This group is also a partnership member, no need to mention in the members array.
   * @type {GroupId} 
   **/
  #ownerId;

  /** @type {GroupIdSet} */ 
  #memberIds;

  /**
   * A flag indicating whether the group members have all roles in all rolesets by default.
   * 
   * @type {boolean} 
   **/
  #membersHaveAllRolesByDefault;

  /**
   * @returns {PartnershipId}
   */
  get partnershipId(){return this.#partnershipId;}

  /**
   * @returns {GroupId}
   */
  get ownerId(){return this.#ownerId;}

  /**
   * @returns {GroupIdSet}
   */
  get memberIds(){return this.#memberIds;}

  /**
   * A flag indicating whether the partnership members have all roles in all rolesets by default. This flag is set by the group which owns the partnership (more precisely, by a partnerships manager who is acting on behalf of the owner group).
   * 
   * For an in-depth explanation of how roles work, see {@link Group#membersHaveAllRolesByDefault}.
   * 
   * @returns {boolean}
   */
  get membersHaveAllRolesByDefault(){return this.#membersHaveAllRolesByDefault;}

  /**
   * Returns a set containing the owner group and the member groups.
   * @returns {GroupIdSet}
   */
  get participantIds(){
    return (
      new GroupIdSet()
      .add(this.ownerId)
      .union(this.memberIds)
    );
  }

  /**
   * 
   * @param {{partnershipId: PartnershipId | undefined, ownerId: GroupId, memberIds: GroupIdSet | undefined, membersHaveAllRolesByDefault: boolean | undefined}} partnership
   * @throws {TypeError}
   */
  constructor(partnership) {
    if(!(
      partnership instanceof Object &&
      !(partnership instanceof Array)
    ))
    throw new TypeError('Bad arg');

    if(!(
      !partnership.partnershipId ||
      partnership.partnershipId instanceof PartnershipId
    ))
    throw new TypeError('Not valid partnership id');

    if(!(
      partnership.ownerId instanceof GroupId
    ))
    throw new TypeError('Not valid owner');

    if(!(
      !partnership.memberIds ||
      (
        partnership.memberIds instanceof GroupIdSet &&
        partnership.memberIds.has(partnership.ownerId)
      )
    ))
    throw new TypeError('Not valid members');

    if(!(
      partnership.membersHaveAllRolesByDefault === undefined ||
      typeof partnership.membersHaveAllRolesByDefault === 'boolean'
    ))
    throw new TypeError('Not valid member roles flag');

    partnership.memberIds = partnership.memberIds ?? new GroupIdSet().add(partnership.ownerId);

    this.#partnershipId = partnership.partnershipId ?? barepartnership_id`${partnership.ownerId.bareId}`;
    this.#ownerId       = partnership.ownerId;
    this.#memberIds     = partnership.memberIds?.clone();
    this.#membersHaveAllRolesByDefault = (
      partnership.membersHaveAllRolesByDefault === undefined ? true : partnership.membersHaveAllRolesByDefault
    );
  }

  /**
   * 
   * @param {(GroupId | GroupIdSet)} groupIds
   * @returns {boolean}
   */
  hasMembers(groupIds) {
    if (groupIds instanceof GroupId) groupIds = new GroupIdSet().add(groupIds);
    for (const groupId of groupIds.members) {
      if(!this.memberIds.has(groupId)) return false;
    }
    return true;
  }

  /**
   * 
   * @param {(GroupId | GroupIdSet)} groupIds
   * @returns {boolean}
   */
  hasParticipants(groupIds) {
    if (groupIds instanceof GroupId) groupIds = new GroupIdSet().add(groupIds);
    for (const groupId of groupIds.members) {
      if(!this.participantIds.has(groupId)) return false;
    }
    return true;
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
   * Writes the partnership to an RDF dataset.
   * @param {object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    const
    partnershipIdTerm = t.namedNode(`${this.partnershipId}`),
    ownerIdTerm       = t.namedNode(`${this.ownerId}`);

    dataset.add(
      t.quad(partnershipIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Partnership`))
    );
    dataset.add(
      t.quad(partnershipIdTerm, t.namedNode(`${QRM}ownerGroup`), ownerIdTerm)
    );

    for (const memberId of this.memberIds.members) {
      const memberIdTerm = t.namedNode(`${memberId}`);
      dataset.add(
        t.quad(partnershipIdTerm, t.namedNode(`${QRM}memberGroup`), memberIdTerm)
      );
    }
    dataset.add(
      t.quad(
        partnershipIdTerm, 
        t.namedNode(`${QRM}membersHaveAllRolesByDefault`), 
        t.literal(`${this.membersHaveAllRolesByDefault}`, t.namedNode(`${XSD}boolean`))
      )
    );
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Partnership[]}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    try {
      const 
      res = [],

      partnershipIdsDs = dataset.match(
        null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Partnership`)
      );

      // handle each partnership
      for (const partnershipIdQuad of partnershipIdsDs) {
        const
        partnershipIdTerm = partnershipIdQuad.subject,
        partnershipId     = partnership_id`${partnershipIdTerm.value}`,
        ownerIdDs         = dataset.match(partnershipIdTerm, t.namedNode(`${QRM}ownerGroup`)),
        memberIdsDs       = dataset.match(partnershipIdTerm, t.namedNode(`${QRM}memberGroup`)),
        membersHaveAllRolesByDefaultDs = (
          dataset.match(partnershipIdTerm, t.namedNode(`${QRM}membersHaveAllRolesByDefault`))
        );

        // check for obvious data validity issues
        if (ownerIdDs.size !== 1) {
          throw new TypeError('partnership must have exactly one owner.');
        }

        // read ownerId
        let ownerId;
        for (const ownerIdQuad of ownerIdDs) {
          const ownerIdTerm = ownerIdQuad.object;
          ownerId = group_id`${ownerIdTerm.value}`;
        }

        // read memberIds
        const memberIds = new GroupIdSet();
        for (const memberIdQuad of memberIdsDs) {
          const memberIdTerm = memberIdQuad.object;
          memberIds.add(group_id`${memberIdTerm.value}`);
        }

        let membersHaveAllRolesByDefault = false;
        for (const memberRolesFlagQuad of membersHaveAllRolesByDefaultDs) {
          const memberRolesFlagTerm = memberRolesFlagQuad.object;
          membersHaveAllRolesByDefault = `${memberRolesFlagTerm.value}` === 'true'
        }

        res.push(new Partnership({partnershipId, ownerId, memberIds, membersHaveAllRolesByDefault}));
      }

      return res;      
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(Partnership|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const partnerships = Partnership.readFrom(dataset);
      if (partnerships.length === 0) {
        return null;
      }
      return partnerships[0];
    } catch (_error) {
      return null;
    }
  }

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Partnership)) return false;
    return this.partnershipId.equals(other.partnershipId);
  }
}

export {
  Partnership,
};