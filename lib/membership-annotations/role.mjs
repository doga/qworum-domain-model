
import { 
  IRL, irl,
  rdfTerm as t, rdf,
  Language, 
} from '../../deps.mjs';

import { RDF, SKOS, QRM } from "../util/rdf-prefixes.mjs";
import { I18nText } from "../util/i18n-text.mjs";
// import { IRL } from "../id.mjs";

/**
 * A user role within a group.
 * Each role belongs to exactly one roleset. The rolesetId prefixes each roleId that belongs to the roleset.
 * All roles that aren't the root role in a roleset have a parent role.
 */
class Role {
  /** @type {IRL} */
  #roleId;
  
  /** @type {I18nText} */
  #description;
  
  /** 
   * @type {(IRL | null)} 
   **/
  #parentRoleId;

  /**
   * @returns {IRL}
   */
  get roleId(){return this.#roleId;}

  /**
   * @returns {I18nText}
   */
  get description(){return this.#description;}

  /**
   * When a role has a parent role, this means that the role has all the permissions of the parent role, and it may have additional permissions that the parent role does not have.
   * @returns {(IRL | null)} 
   */
  get parentRoleId(){return this.#parentRoleId;}
  
  /**
   * 
   * @param {{roleId: IRL, description: I18nText | undefined, parentRoleId: IRL | undefined}} role 
   */
  constructor(role){
    this.#roleId       = role.roleId;
    this.#description  = role.description ?? new I18nText();
    this.#parentRoleId = role.parentRoleId ?? null;
  }

  /**
   * 
   * @param {object} dataset 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    const idTerm = t.namedNode(`${this.roleId}`);

    // type
    dataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Role`))
    );
    dataset.add(
      t.quad(idTerm, t.namedNode(`${RDF}type`), t.namedNode(`${SKOS}Concept`))
    );

    // parent role
    if(this.parentRoleId){
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}parentRole`), t.namedNode(`${this.parentRoleId}`))
      );
      dataset.add(
        t.quad(idTerm, t.namedNode(`${SKOS}broader`), t.namedNode(`${this.parentRoleId}`))
      );
    }

    // description
    for (const lang of this.description.getLangs()) {
      const text = this.description.getText(lang);
      dataset.add(
        t.quad(idTerm, t.namedNode(`${QRM}description`), t.literal(text, lang.iso639_1))
      );
    }
  }

  /**
   * @returns {object} a dataset
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
   * @returns {Role[]}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    const
    res   = [],
    idsDs = dataset.match(null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Role`));

    for (const quad of idsDs) {
      try {
        // read id
        const 
        roleIdTerm = quad.subject,
        roleId     = irl`${roleIdTerm.value}`;

        if(!roleId)throw new Error('not a role id');

        // read description
        const 
        description = new I18nText(),
        descrDs     = dataset.match(roleIdTerm, t.namedNode(`${QRM}description`));
        for (const quad of descrDs) {
          try {
            const 
            textTerm = quad.object,
            text     = textTerm.value,
            lang     = Language.fromCode(textTerm.language.split('-')[0]);

            description.setText(text, lang);
          } catch (error) {
            console.debug(`[Role.readFrom] description error`,error);
          }
        }
        
        // read parent role (one at most)
        const parentRoleIdDs = dataset.match(roleIdTerm, t.namedNode(`${QRM}parentRole`));
        let parentRoleId;
        for (const quad of parentRoleIdDs) {
          try {
            parentRoleId = irl`${quad.object.value}`;
          } catch (error) {
            console.debug(`[Role.readFrom] parent role error`,error);
          }
        }

        res.push(new Role({roleId, description, parentRoleId}));
      } catch (error) {
        console.debug(`[Role.readFrom] `,error);
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(Role|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const ids = Role.readFrom(dataset);
      if (ids.length === 0) {
        return null;
      }
      return ids[0];
    } catch (_error) {
      return null;
    }
  }

  /**
   * 
   * @param {*} other 
   */
  equals(other){
    if(!(other instanceof Role)) return false;
    return this.roleId.equals(other.roleId);
  }

}


/**
 * A set of roles that are assignable by the managers of group memberships to group members.
 */
class Roleset {
  /** 
   * @type {IRL} 
   **/
  #rolesetId;

  /** @type {Role[]} */
  #roles;
  
  /** @type {I18nText} */
  #description;

  /** @returns {IRL} */
  get rolesetId(){return this.#rolesetId;}

  /** @returns {Role[]} */
  get roles() {return [...this.#roles];}

  /** @returns {I18nText} */
  get description() {return this.#description;}

  /**
   * @param {({rolesetId: IRL, roles: Role[] | undefined, description: I18nText | undefined} | undefined)} roleset 
   * @throws {TypeError}
   */
  constructor(roleset) {
    // check arg
    if(!roleset)roleset = {};
    if(!(roleset.roles instanceof Array))roleset.roles = [];

    // check roleset id
    const rolesetIdEndings = ['#', '/'];
    if (!(
      roleset.rolesetId instanceof IRL && 
      rolesetIdEndings.find(ending => `${roleset.rolesetId}`.endsWith(ending))
    )) throw new TypeError('not a roleset id');

    // check roles
    if (
      !roleset.roles.every(
        r => r instanceof Role && `${r.roleId}`.startsWith(`${roleset.rolesetId}`) 
      )
    ) throw new TypeError('some roles are unsuitable for this roleset');

    // check that:
    // - the role set is a DAG (directed acyclic graph).
    // - all parent-role links point to an existing role
    for (const focusRole of roleset.roles) {
      let role = focusRole;
      while(role.parentRoleId){
        if (role.parentRoleId.equals(focusRole.roleId)) {
          throw new TypeError(
            `Roleset is not a DAG (directed acyclic graph). Detected cycle on role <${focusRole.roleId}>`
          );
        }

        role = roleset.roles.find(r => r.roleId.equals(role.parentRoleId));
        if (!role) throw new TypeError(`Missing role: <${role.parentRoleId}>`);
      }
    }

    this.#rolesetId   = roleset.rolesetId;
    this.#roles       = roleset.roles;
    this.#description = roleset.description ?? new I18nText();
  }

  /**
   * @param {(Role | IRL)} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.#roles.find(r => (role instanceof Role ? r.equals(role) : r.roleId.equals(role)));
  }

  // /**
  //  * Adds a role to the roleset. Returns this same object for call-chaining puroposes.
  //  * @param {Role} role
  //  * @returns {Roleset}
  //  * @throws {TypeError}
  //  */
  // setRole(role) {
  //   // check arg
  //   if(!(
  //     role instanceof Role && `${role.roleId}`.startsWith(`${this.rolesetId}`) &&
  //     ( // TODO detect cycles
  //       role.parentRoleId && this.roles.find(r2 => r2.roleId.equals(role.parentRoleId))
  //     )
  //   ))throw new TypeError('not a role for this roleset');

  //   if(role.equals(this.topRole))return this;

  //   if (this.hasRole(role))return;
  //   this.#roles.push(role);
  //   return this;
  // }

  // /**
  //  * Removes a non-top role from the roleset. Returns this same object for call-chaining puroposes.
  //  * @param {Role} role
  //  * @returns {Roleset}
  //  */
  // unsetRole(role) {
  //   if (!this.hasRole(role))return this;
  //   if(role.equals(this.topRole))return this;
  //   let index;
  //   for (let i = 0; i < this.#roles.length; i++) {
  //     const r = this.#roles[i];
  //     if (r.equals(role)) {
  //       index = i; break;
  //     }
  //   }
  //   if(!index)return this;
  //   this.#roles.splice(index,1);
  //   return this;
  // }

  /**
   * Returns a role whose ID matches the call argument.
   * @param {(IRL | Role | RegExp | string)} matcher
   * @returns {(Role | null)}
   * @throws {TypeError}
   */
  findRole(matcher){
    try {
      return this.#roles.find(
        r => (
          (matcher instanceof IRL && r.roleId.equals(matcher)) ||
          (matcher instanceof Role && r.equals(matcher)) ||
          `${r.roleId}`.match(matcher)
        )
      ) ?? null;
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  // /**
  //  * 
  //  * @param {Role} role 
  //  * @param {IRL} ancestorRoleId 
  //  * @returns {(Role | null)}
  //  * @throws {TypeError}
  //  */
  // findAncestorRole(role, ancestorRoleId){
  //   if (!(role instanceof Role)) {
  //     throw new TypeError('not a role');
  //   }
  //   if (!(ancestorRoleId instanceof IRL)) {
  //     throw new TypeError('not a role id');
  //   }

  //   let r = role;
  //   const visited = [];
  //   while(r){
  //     // ancestor not found?
  //     if (!r) return null;

  //     // // detect cycles in roleset
  //     // if (visited.find(id => id.equals(r.roleId))) {
  //     //   throw new TypeError(`cycle detected in roleset <${this.rolesetId}> involving role <${r.roleId}>`)
  //     // }

  //     visited.push(r.roleId);

  //     // ancestor found?
  //     if (r.roleId.equals(ancestorRoleId)) return r;

  //     // check parent
  //     r = this.findRole(r.parentRoleId);
  //   }

  // }


  /**
   * Finds the minimum number of roles that imply also having all of the other roles in the roleset.
   * 
   * @returns {Role[]}
   */
  get generalSet(){
    /** @type {Role[]} */
    const res = [];

    for (const role of this.roles) {
      // if `role` is some other role's parent, then `role` is not part of the general set
      if(this.roles.find(r => role.roleId.equals(r.parentRoleId)))continue;

      res.push(role);
    }

    return res;
  }


  /**
   * Finds all roles that imply also having the role `role`.
   * 
   * @param {(Role | IRL)} role 
   * @returns {Role[]}
   * @throws {TypeError}
   */
  getDescendentsOf(role){
    if(!(role instanceof Role)) role = this.findRole(role);
    if(!role)throw new TypeError('role not found in roleset');

    const 
    /** @type {Role[]} */
    res = [],

    /**
     * @param {(Role | IRL)} role
     * @returns {boolean}
     */
    alreadyMarkedAsADescendent = role => res.find(r => (role instanceof Role ? r.equals(role) : r.roleId.equals(role))),

    /**
     * @param {Role} role
     * @returns {boolean}
     */
    descendentRoleIsParentOf = role => res.find(r => r.roleId.equals(role.parentRoleId));

    let addedRoleToResults = true;
    while (addedRoleToResults) {
      addedRoleToResults = false;

      for (const r of this.roles) {
        if(alreadyMarkedAsADescendent(r))continue;
        if (
          // root role is direct parent?
          role.roleId.equals(r.parentRoleId) ||

          descendentRoleIsParentOf(r)
        ) {
          res.push(r);
          addedRoleToResults = true;
          continue;
        }
      }
    }

    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    const 
    rolesetIdTerm = t.namedNode(`${this.rolesetId}`);

    // type
    dataset.add(
      t.quad(rolesetIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Roleset`))
    );
    dataset.add(
      t.quad(rolesetIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${SKOS}ConceptScheme`))
    );

    // roles
    for (const role of this.roles) {
      role.writeTo(dataset);

      // link role to roleset
      const roleIdTerm = t.namedNode(`${role.roleId}`);

      if(!role.parentRoleId){
        dataset.add(
          t.quad(rolesetIdTerm, t.namedNode(`${SKOS}hasTopConcept`), roleIdTerm)
        );
        dataset.add(
          t.quad(roleIdTerm, t.namedNode(`${SKOS}topConceptOf`), rolesetIdTerm)
        );
      }

      dataset.add(
        t.quad(roleIdTerm, t.namedNode(`${SKOS}inScheme`), rolesetIdTerm)
      );
    }

    // description
    for (const lang of this.description.getLangs()) {
      const text = this.description.getText(lang);
      dataset.add(
        t.quad(rolesetIdTerm, t.namedNode(`${QRM}description`), t.literal(text, lang.iso639_1))
      );
    }
  }

  /**
   * @returns {object} a dataset
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
   * @returns {Roleset[]}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readFrom(dataset){
    const
    res          = [],
    rolesetIdsDs = dataset.match(null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Roleset`));

    for (const quad of rolesetIdsDs) {
      try {
        // read id
        const 
        rolesetIdTerm = quad.subject,
        rolesetId     = irl`${rolesetIdTerm.value}`;

        if(!rolesetId)throw new Error('not a roleset id');
        
        // read roles
        const
        roleIdsDs = dataset.match(null, t.namedNode(`${SKOS}inScheme`), rolesetIdTerm),
        roles     = [];

        for (const quad2 of roleIdsDs) {
          const 
          roleId     = irl`${quad2.subject.value}`,
          roleIdTerm = t.namedNode(`${roleId}`),
          roleDs     = dataset.match(roleIdTerm),
          role       = Role.readOneFrom(roleDs);

          if(role)roles.push(role);
        }

        // read description
        const 
        description = new I18nText(),
        descrDs     = dataset.match(rolesetIdTerm, t.namedNode(`${QRM}description`));
        for (const quad2 of descrDs) {
          try {
            const 
            textTerm = quad2.object,
            text     = textTerm.value,
            lang     = Language.fromCode(textTerm.language.split('-')[0]);

            description.setText(text, lang);
          } catch (error) {
            console.debug(`[Roleset.readFrom] description error`,error);
          }
        }
        // console.debug(`[Roleset.readFrom] description`,description);

        // create roleset
        const roleset = new Roleset({rolesetId, roles, description});
        // console.debug(`[Roleset.readFrom] roleset`,roleset);

        res.push(roleset);
      } catch (error) {
        console.debug(`[Roleset.readFrom] `,error);
      }
    }
    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(Roleset|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const ids = Roleset.readFrom(dataset);
      if (ids.length === 0) {
        console.debug(`[Roleset] readOneFrom: no roleset`);
        return null;
      }
      return ids[0];
    } catch (_error) {
      console.debug(`[Roleset] readOneFrom`, _error);
      return null;
    }
  }

  /**
   * 
   * @param {*} other 
   */
  equals(other){
    if(!(other instanceof Roleset)) return false;
    return this.rolesetId.equals(other.rolesetId);
  }
}


const
en = Language.fromCode('en'),

rolesetId = irl`${QRM}id/roleset/`,

description = new I18nText().setText('A capability-based roleset for Qworum services. This roleset is agnostic in terms of application category. Alternatively, applications have the option of using another roleset that is specific to their software categories. To this end, applications can define their own rolesets, or use third-party rolesets that are targeting their software vertical.', en),

drafter = new Role({
  roleId      : irl`${rolesetId}drafter`,
  description : new I18nText().setText('The user can create, read, update and delete persona-owned data. The main use case is the drafting of documents before making them available to the group.', en)
}),

reader = new Role({
  roleId      : irl`${rolesetId}reader`,
  description : new I18nText().setText('The user can read group-owned data.', en)
}),

upserter = new Role({
  roleId      : irl`${rolesetId}upserter`,
  parentRoleId: reader.roleId,
  description : new I18nText().setText('The user can create and update and read group-owned data, but not delete the data.', en)
}),

writer =   new Role({
  roleId      : irl`${rolesetId}writer`,
  parentRoleId: upserter.roleId,
  description : new I18nText().setText('The user can create, read, update and delete group-owned data.', en)
}),

/**
 * A roleset that is application-category-agnostic. It has roles that define what the user's CRUD permissions are with regards to the group's data, and whether he/she can draft data, in which case the data will belong to the persona rather than the group during the drafting phase.
 * @type {Roleset} 
 **/
defaultRoleset = new Roleset({
  rolesetId, description,
  roles: [drafter, reader, upserter, writer]
});


export {Role, Roleset, defaultRoleset};
