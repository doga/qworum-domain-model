// RDF
import { IRI, iri, rdfTerm as t, rdf } from "../../deps.mjs";
import { QRM, RDF } from "../util/rdf-prefixes.mjs";

import { 
  UserId, GroupId, MembershipId, 
  group_id, membership_id, user_id,
} from "../id.mjs";
import { defaultRoleset } from "./role.mjs";


// TODO add validity period(s)

/**
 * An annotation on a group membership that restricts it and defines it more precisely.
 */
class Membership {
  /** @type {MembershipId} */ #membershipId;

  /** 
   * @type {UserId} 
   **/
  #userId;

  /** @type {GroupId} */ 
  #groupId;

  /** @type {IRI[]} */ 
  roleIds;

  /**
   * @returns {MembershipId}
   */
  get membershipId(){return this.#membershipId;}

  /**
   * @returns {UserId}
   */
  get userId(){return this.#userId;}

  /**
   * @returns {GroupId}
   */
  get groupId(){return this.#groupId;}

  /**
   * 
   * @param {{membershipId: MembershipId | undefined, userId: UserId, groupId: GroupId, roleIds: IRI[] | undefined}} membership
   * @throws {TypeError}
   */
  constructor(membership) {
    if(!(
      !membership.membershipId ||
      membership.membershipId instanceof MembershipId
    )) {
      throw new TypeError('unexpected membershipId');
    }

    if (!(membership.userId instanceof UserId)) {
      throw new TypeError('unexpected userId');
    }

    if (!(membership.groupId instanceof GroupId)) {
      throw new TypeError('unexpected groupId');
    }

    if (!(
      !membership.roleIds ||
      (membership.roleIds instanceof Array && membership.roleIds.every(r => r instanceof IRI))
    )) {
      throw new TypeError('unexpected roleIds');
    }

    if (!membership.membershipId) {
      membership.membershipId = MembershipId.uuid();
    }

    if (!membership.roleIds || membership.roleIds.length === 0) {
      membership.roleIds = [defaultRoleset.topRole.roleId];
    }

    this.#membershipId = membership.membershipId;
    this.#userId       = membership.userId;
    this.#groupId      = membership.groupId;
    this.roleIds       = [...membership.roleIds];
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
   * Writes the membership to an RDF dataset.
   * @param {object} dataset
   * @throws {Error}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    // write the membership
    const
    membershipIdTerm = t.namedNode(`${this.membershipId}`);

    dataset.add(
      t.quad(membershipIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Membership`))
    );

    for (const roleId of this.roleIds) {
      const roleIdTerm = t.namedNode(`${roleId}`);
      dataset.add(
        t.quad(membershipIdTerm, t.namedNode(`${QRM}role`), roleIdTerm)
      );
    }

    // write the reification
    const 
    userIdTerm     = t.namedNode(`${this.userId}`),
    groupIdTerm    = t.namedNode(`${this.groupId}`),
    reifiedQuad    = t.quad(groupIdTerm, t.namedNode(`${QRM}member`), userIdTerm),
    annotationQuad = t.quad(reifiedQuad, t.namedNode(`${QRM}groupMembership`), membershipIdTerm);

    dataset.add(reifiedQuad);
    dataset.add(annotationQuad);
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Membership[]}
   * @throws {TypeError}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    try {
      const 
      res = [],
      reificationsDs = dataset.match(
        null, t.namedNode(`${QRM}member`)
      );

      // read the annotated membership links
      for (const reifiedQuad of reificationsDs) {
        // console.debug(`reifiedQuad`,reifiedQuad);
        const 
        groupId       = group_id`${reifiedQuad.subject.value}`,
        userId        = user_id`${reifiedQuad.object.value}`,
        annotationsDs = dataset.match(
          reifiedQuad, t.namedNode(`${QRM}groupMembership`)
        );

        // console.debug(`annotationsDs.size`,annotationsDs.size);
        
        // read the annotation
        for (const annotationQuad of annotationsDs) {
          // console.debug(`annotationQuad`,annotationQuad);
          const
          membershipIdTerm = annotationQuad.object,
          membershipId     = membership_id`${membershipIdTerm.value}`,
          roleIdsDs        = dataset.match(membershipIdTerm, t.namedNode(`${QRM}role`)),
          roleIds          = [];
          
          for (const roleIdQuad of roleIdsDs) {
            roleIds.push(iri`${roleIdQuad.object.value}`);
          }

          res.push(
            new Membership({membershipId, groupId, userId, roleIds})
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
   * @returns {(Membership|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const memberships = Membership.readFrom(dataset);
      if (memberships.length === 0) {
        return null;
      }
      return memberships[0];
    } catch (error) {
      return null;
    }
  }

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Membership)) return false;
    return this.membershipId.equals(other.membershipId);
  }
}

export {
  Membership,
};