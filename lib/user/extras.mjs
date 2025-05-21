
import { rdfTerm as t, rdf, iri } from "../../deps.mjs";
import { QRM, RDF } from "../util/rdf-prefixes.mjs";
import { UserId, user_id, GroupId, group_id, OrgId, org_id, baregroup_id, PasswordId, } from "../id.mjs";
import { isObject } from "../util/format-verifier.mjs";

/**
 * User-related data that is stored in the user repo not the auth repo.
 */
class UserExtras {
  /** @type {UserId} */ userId;
  /** @type {GroupId[]} */ groupIds;
  /** @type {OrgId[]} */ orgIds;

  /** 
   * @param {({userId: UserId | undefined, groupIds: GroupId[] | undefined, orgIds: OrgId[] | undefined} | undefined)} user
   */
  constructor(user){
    if(!isObject(user))user = {};

    this.userId   = user.userId ?? UserId.uuid();
    this.groupIds = user.groupIds ?? [];
    this.orgIds   = user.orgIds ?? [];
  }

  /**
   * @param {UserId} userId
   * @returns {UserExtras}
   */
  static create(userId){
    return new UserExtras({userId});
  };

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof UserExtras)) return false;
    return this.userId.equals(other.userId);
  }

  /**
   * 
   * @param {object} dataset a DatasetCore object
   * @returns {UserExtras[]}
   */
  static readFrom(dataset){
    const 
    res = [],
    groupDs = dataset.match(
      null, t.namedNode(`${QRM}group`),
    ),
    orgDs = dataset.match(
      null, t.namedNode(`${QRM}org`),
    );

    for (const quad of groupDs) {
      const
      userId  = user_id`${quad.subject.value}`,
      groupId = group_id`${quad.object.value}`;

      if(!(userId instanceof UserId && groupId instanceof GroupId))continue;

      let userExtras = res.find(ue => ue.userId.equals(userId));

      if (!userExtras) {
        userExtras = UserExtras.create(userId);
        res.push(userExtras);
      }

      userExtras.groupIds.push(groupId);
    }

    for (const quad of orgDs) {
      const
      userId = user_id`${quad.subject.value}`,
      orgId  = org_id`${quad.object.value}`;

      if(!(userId instanceof UserId && orgId instanceof OrgId))continue;

      let userExtras = res.find(ue => ue.userId.equals(userId));

      if (!userExtras) {
        userExtras = UserExtras.create(userId);
        res.push(userExtras);
      }

      userExtras.orgIds.push(orgId);
    }

    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(UserExtras|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const users = UserExtras.readFrom(dataset);
      if (users.length === 0) {
        return null;
      }
      return users[0];
    } catch (_error) {
      return null;
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
   * 
   * @param {object} dataset 
   */
  writeTo(dataset){
    const
    userIdTerm     = t.namedNode(`${this.userId}`),
    groupPredicate = t.namedNode(`${QRM}group`),
    orgPredicate   = t.namedNode(`${QRM}org`);

    for (const groupId of this.groupIds)
    dataset.add(
      t.quad(userIdTerm, groupPredicate, t.namedNode(`${groupId}`))
    );

    for (const orgId of this.orgIds)
    dataset.add(
      t.quad(userIdTerm, orgPredicate, t.namedNode(`${orgId}`))
    );
  }
}

export { UserExtras };
