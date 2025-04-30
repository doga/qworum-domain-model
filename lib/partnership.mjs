// RDF
import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { GroupId, PartnershipId, group_id, partnership_id, } from "./id.mjs";


class Partnership {
  /** @type {PartnershipId} */ 
  partnershipId;

  /** 
   * The group that has created the partnership.
   * This group is also a partnership member, no need to mention in the members array.
   * @type {GroupId} 
   **/
  ownerId;

  /** @type {GroupId[]} */ 
  memberIds;

  /**
   * 
   * @param {{partnershipId: PartnershipId | undefined, ownerId: GroupId, memberIds: GroupId[] | undefined}} partnership
   */
  constructor(partnership) {
    this.partnershipId = partnership.partnershipId ?? PartnershipId.uuid();
    this.ownerId       = partnership.ownerId;
    this.memberIds     = partnership.memberIds ?? [];
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

    for (const memberId of this.memberIds) {
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
        const memberIds = [];
        for (const memberIdQuad of memberIdsDs) {
          const memberIdTerm = memberIdQuad.object;
          memberIds.push(group_id`${memberIdTerm.value}`);
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