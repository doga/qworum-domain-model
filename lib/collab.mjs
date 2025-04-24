// RDF
import { rdfTerm as t, rdf } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { GroupId, CollabId, groupid, collabid, } from "../lib/id.mjs";


class Collab {
  /** @type {CollabId} */ collabId;

  /** 
   * The group that has created the collab.
   * This group is also a collab member, no need to mention in the members array.
   * @type {GroupId} 
   **/
  ownerGroupId;

  /** @type {GroupId[]} */ invitedGroupIds;

  /**
   * 
   * @param {{collabId: CollabId | undefined, ownerGroupId: GroupId | undefined, invitedGroupIds: GroupId[]}} collab
   */
  constructor(collab) {
    this.collabId        = collab.collabId ?? CollabId.uuid();
    this.ownerGroupId    = collab.ownerGroupId;
    this.invitedGroupIds = collab.invitedGroupIds;
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
   * Writes the collab to an RDF dataset.
   * @param {object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    const
    collabIdTerm     = t.namedNode(`${this.collabId}`),
    ownerGroupIdTerm = t.namedNode(`${this.ownerGroupId}`);

    dataset.add(
      t.quad(collabIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Collab`))
    );
    dataset.add(
      t.quad(collabIdTerm, t.namedNode(`${QRM}ownerGroup`), ownerGroupIdTerm)
    );

    for (const memberGroupId of this.invitedGroupIds) {
      const memberGroupIdTerm = t.namedNode(`${memberGroupId}`);
      dataset.add(
        t.quad(collabIdTerm, t.namedNode(`${QRM}invitedGroup`), memberGroupIdTerm)
      );
    }
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Collab[]}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    try {
      const 
      res = [],
      collabIdsDataset = dataset.match(
        null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Collab`)
      );
  
      // handle each collab
      for (const collabIdQuad of collabIdsDataset) {
        const
        collabIdTerm          = collabIdQuad.subject,
        collabId              = collabid`${collabIdTerm.value}`,
        ownerGroupIdDataset   = dataset.match(collabIdTerm, t.namedNode(`${QRM}ownerGroup`)),
        memberGroupIdsDataset = dataset.match(collabIdTerm, t.namedNode(`${QRM}invitedGroup`));

        // check for obvious data validity issues
        if (ownerGroupIdDataset.size !== 1) {
          throw new TypeError('collab must have exactly one owner.');
        }

        // read ownerGroupId
        let ownerGroupId;
        for (const ownerGroupIdQuad of ownerGroupIdDataset) {
          const ownerGroupIdTerm = ownerGroupIdQuad.object;
          ownerGroupId = groupid`${ownerGroupIdTerm.value}`;
        }

        // read invitedGroupIds
        const invitedGroupIds = [];
        for (const memberGroupIdQuad of memberGroupIdsDataset) {
          const memberGroupIdTerm = memberGroupIdQuad.object;
          invitedGroupIds.push(groupid`${memberGroupIdTerm.value}`);
        }

        res.push(new Collab({collabId, ownerGroupId, invitedGroupIds}));
      }

      return res;      
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(Collab|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const collabs = Collab.readFrom(dataset);
      if (collabs.length === 0) {
        return null;
      }
      return collabs[0];
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
    if (!(other instanceof Collab)) return false;
    return this.collabId.equals(other.collabId);
  }
}

export {
  Collab,
};