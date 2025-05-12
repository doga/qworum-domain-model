// RDF
import { rdfTerm as t, rdf } from "../../deps.mjs";
import { QRM, RDF } from "../util/rdf-prefixes.mjs";

import { 
  GroupId, MembershipId, PartnershipId, PartnershipMembershipId,  RoleId,  group_id, partnership_id, partnership_membership_id, role_id, 
} from "../id.mjs";

import { platformRoleset } from "./role.mjs";

// TODO add validity period(s)

/**
 * An annotation on a partnership membership that restricts it and defines it more precisely.
 */
class PartnershipMembership {
  /** @type {PartnershipMembershipId} */ partnershipMembershipId;

  /** 
   * The partnership that the group is a member of.
   * @type {PartnershipId} 
   **/
  partnershipId;

  /** @type {GroupId} */ 
  groupId;

  /** @type {GroupId[]} */ 
  roleIds;

  /**
   * To remove all permissions from the group, set roleIds to an empty group. 
   * If roleIds is undefined, by default the group has full permissions.
   * @param {{partnershipMembershipId: PartnershipMembershipId | undefined, partnershipId: PartnershipId, groupId: GroupId, roleIds: RoleId[] | undefined}} partnershipMembership
   * @throws {TypeError}
   */
  constructor(partnershipMembership) {
    this.partnershipMembershipId = partnershipMembership.partnershipMembershipId ?? PartnershipMembershipId.uuid();
    this.partnershipId           = partnershipMembership.partnershipId;
    this.groupId                 = partnershipMembership.groupId;
    this.roleIds                 = partnershipMembership.roleIds ?? [platformRoleset.findRole('unrestricted').roleId];

    if (!(this.partnershipMembershipId instanceof PartnershipMembershipId)) {
      throw new TypeError('unexpected partnershipMembershipId');
    }

    if (!(this.partnershipId instanceof PartnershipId)) {
      throw new TypeError('unexpected partnershipId');
    }

    if (!(this.groupId instanceof GroupId)) {
      throw new TypeError('unexpected groupId');
    }

    if (!(this.roleIds instanceof Array && this.roleIds.every(r => r instanceof RoleId))) {
      throw new TypeError('unexpected roleIds');
    }
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
   * Writes the partnership membership to an RDF dataset.
   * @param {object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    // write the partnership membership
    const
    partnershipMembershipIdTerm = t.namedNode(`${this.partnershipMembershipId}`);

    dataset.add(
      t.quad(partnershipMembershipIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}PartnershipMembership`))
    );

    for (const roleId of this.roleIds) {
      const roleIdTerm = t.namedNode(`${roleId}`);
      dataset.add(
        t.quad(partnershipMembershipIdTerm, t.namedNode(`${QRM}role`), roleIdTerm)
      );
    }

    // write the reification
    const 
    partnershipIdTerm = t.namedNode(`${this.partnershipId}`),
    groupIdTerm       = t.namedNode(`${this.groupId}`),
    reifiedQuad       = t.quad(partnershipIdTerm, t.namedNode(`${QRM}partnershipMember`), groupIdTerm),
    annotationQuad    = t.quad(reifiedQuad, t.namedNode(`${QRM}partnershipMembership`), partnershipMembershipIdTerm);

    dataset.add(reifiedQuad);
    dataset.add(annotationQuad);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {PartnershipMembership[]}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    try {
      const 
      res = [],
      reificationsDs = dataset.match(
        null, t.namedNode(`${QRM}partnershipMember`)
      );

      // read the annotated partnershipMember links
      for (const reifiedQuad of reificationsDs) {
        const 
        partnershipId = partnership_id`${reifiedQuad.subject.value}`,
        groupId       = group_id`${reifiedQuad.object.value}`,
        annotationsDs = dataset.match(
          reifiedQuad, t.namedNode(`${QRM}partnershipMembership`)
        );

        // read the annotation
        for (const annotationQuad of annotationsDs) {
          const
          partnershipMembershipIdTerm = annotationQuad.object,
          partnershipMembershipId     = partnership_membership_id`${partnershipMembershipIdTerm.value}`,
          roleIdsDs                   = dataset.match(partnershipMembershipIdTerm, t.namedNode(`${QRM}role`)),
          roleIds                     = [];
          
          for (const roleIdQuad of roleIdsDs) {
            roleIds.push(role_id`${roleIdQuad.object.value}`);
          }

          res.push(
            new PartnershipMembership({partnershipMembershipId, partnershipId, groupId, roleIds})
          )
        }
      }

      return res;   
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(PartnershipMembership|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const partnershipMemberships = PartnershipMembership.readFrom(dataset);
      if (partnershipMemberships.length === 0) {
        return null;
      }
      return partnershipMemberships[0];
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
    if (!(other instanceof PartnershipMembership)) return false;
    return this.partnershipMembershipId.equals(other.partnershipMembershipId);
  }
}

export {
  PartnershipMembership,
};