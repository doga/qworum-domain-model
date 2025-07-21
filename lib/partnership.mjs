// RDF
import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { GroupId, PartnershipId, group_id, partnership_id, GroupIdSet } from "./id.mjs";


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
   * Returns a set containing the owner group and the member groups.
   * @returns {UserIdSet}
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
   * @param {{partnershipId: PartnershipId | undefined, ownerId: GroupId, memberIds: GroupIdSet | undefined}} partnership
   */
  constructor(partnership) {
    partnership.memberIds = partnership.memberIds ?? new GroupIdSet();

    this.#partnershipId = partnership.partnershipId ?? PartnershipId.uuid();
    this.#ownerId       = partnership.ownerId;
    this.#memberIds     = partnership.memberIds.clone();
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
      t.quad(partnershipIdTerm, t.namedNode(`${QRM}owner`), ownerIdTerm)
    );

    for (const memberId of this.memberIds.members) {
      const memberIdTerm = t.namedNode(`${memberId}`);
      dataset.add(
        t.quad(partnershipIdTerm, t.namedNode(`${QRM}member`), memberIdTerm)
      );
    }
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
      partnershipIdsDataset = dataset.match(
        null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Partnership`)
      );
  
      // handle each partnership
      for (const partnershipIdQuad of partnershipIdsDataset) {
        const
        partnershipIdTerm = partnershipIdQuad.subject,
        partnershipId     = partnership_id`${partnershipIdTerm.value}`,
        ownerIdDs         = dataset.match(partnershipIdTerm, t.namedNode(`${QRM}owner`)),
        memberIdsDs       = dataset.match(partnershipIdTerm, t.namedNode(`${QRM}member`));

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

        res.push(new Partnership({partnershipId, ownerId, memberIds}));
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