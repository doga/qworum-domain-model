
import { 
  IRL, irl,
  rdfTerm as t, rdf,
  Language, 
} from '../../deps.mjs';

import { RDF, QRM } from "../util/rdf-prefixes.mjs";
import { I18nText } from "../util/i18n-text.mjs";
import { RoleId, role_id } from "../id.mjs";

/**
 * Defines a user role within a group.
 * 
 * Roles whose IDs have the domain/hostname vocab.qworum.net are usable by all Qworum services, but
 * roles that have a different domain/hostname are only usable by Qworum services that are hosted on 
 * that domain or its subdomains.
 * 
 * Examples:
 * 1. Any Qworum service can demand that its user have the role ID https://vocab.qworum.net/id/role/unrestricted as
 * a precondition to performing a certain action.
 * 2. Only the Qworum services that are hosted on site.example, subdomain.site.example, sub.subdomain.site.example etc
 * can demand that its user have the role ID https://site.example/id/role/unrestricted.
 */
class Role {
  /** @type {RoleId} */
  roleId;

  /** @type {I18nText} */
  description;

  /**
   * 
   * @param {{roleId: RoleId, description: I18nText}} role 
   */
  constructor(role){
    this.roleId      = role.roleId;
    this.description = role.description;
  }

  /**
   * 
   * @param {object} dataset 
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  writeTo(dataset){
    const subjectTerm = t.namedNode(this.roleId.toString());
    dataset.add(
      t.quad(subjectTerm, t.namedNode(`${RDF}type`), t.namedNode(`${RDF}Role`))
    );
    for (const lang of this.description.getLangs()) {
      const text = this.description.getText(lang);
      dataset.add(
        t.quad(subjectTerm, t.namedNode(`${QRM}description`), t.literal(text, lang.iso639_1))
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
    res = [],
    idMatchDs = dataset.match(null, t.namedNode(`${RDF}type`), t.namedNode(`${RDF}Role`));

    for (const quad of idMatchDs) {
      try {
        // read id
        const 
        roleIdTerm = quad.subject,
        roleId     = role_id`${roleIdTerm.value}`;

        if(!roleId)throw new Error('not a role id');

        // read description
        const 
        description  = new I18nText(),
        descrMatchDs = dataset.match(roleIdTerm, t.namedNode(`${QRM}description`));

        for (const descrQuad of descrMatchDs) {
          try {
            const 
            textTerm = descrQuad.object,
            text     = textTerm.value,
            lang     = Language.fromCode(textTerm.language.split('-')[0]);

            description.setText(text, lang);
          } catch (error) {
            console.debug(`[Role.readFrom] `,error);
          }
        }

        res.push(new Role({roleId, description}));
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
 * A set of roles that are assignable to the users of Qworum services.
 * The roleset with the base IRL `https://vocab.qworum.net` can be used in all Qworum services.
 * Rolesets with other base IRLs are service-specific; they can be used for service-specific roles
 * and also for restricting the set of Qworum services that a particular group member is allowed to use.
 */
class RoleSet {
  /** 
   * The base IRL for all platform role IDs.
   * @type {IRL} 
   **/
  static platformBase = irl`${QRM}id/role/`;
  
  /** 
   * The base IRL for all role IDs for this roleset.
   * @type {IRL} 
   **/
  #base;

  /** @type {Role[]} */
  #value;

  /** @returns {IRL} */
  get base(){return this.#base;}

  /**
   *  The base IRL must end with '#' or '/', default is {@link RoleSet.platformBase}.
   * @param {({base: IRL | undefined, value: Role[] | undefined} | undefined)} config 
   * @throws {TypeError}
   */
  constructor(config) {
    // check arg
    if(!config)config = {};
    if (!(
      (config.base === undefined || (config.base instanceof IRL && `${config.base}`.match(/[#/]$/))) &&
      (config.value === undefined || (config.value instanceof Array && config.value.every(r => r instanceof Role)))
    )) {
      throw new TypeError('not a roleset');
    }
    this.#base  = config.base ?? RoleSet.platformBase;
    this.#value = config.value ?? [];
  }

  /**
   * @returns {Role[]}
   */
  get all() {return this.#value.filter(r => true);}

  /**
   * @param {Role} role
   * @returns {boolean}
   */
  hasRole(role) {
    return this.#value.find(r => r.equals(role));
  }

  /**
   * Sets a role within the base IRL. Returns this same object for method-call-chaining puroposes.
   * @param {Role} role
   * @returns {RoleSet}
   * @throws {TypeError}
   */
  setRole(role) {
    if(!(role instanceof Role))throw new TypeError('not a role');
    if(!`${role.roleId}`.startsWith(`${this.#base}`))throw new TypeError('role does not match the base IRL');
    if (this.hasRole(role))return;
    this.#value.push(role);
    return this;
  }

  /**
   * Unsets a role within the base IRL. Returns this same object for method-call-chaining puroposes.
   * @param {Role} role
   * @returns {RoleSet}
   */
  unsetRole(role) {
    if (!this.hasRole(role))return this;
    let index;
    for (let i = 0; i < this.#value.length; i++) {
      const r = this.#value[i];
      if (r.equals(role)) {
        index = i; break;
      }
    }
    if(!index)return this;
    this.#value.splice(index,1);
    return this;
  }

  /**
   * Returns a role whose ID matches the call argument.
   * @param {(RoleId | Role | RegExp | string)} matcher
   * @returns {(Role | null)}
   * @throws {TypeError}
   */
  findRole(matcher){
    try {
      return this.#value.find(
        r => r.roleId.equals(matcher) || r.equals(matcher) || `${r.roleId}`.match(matcher)
      ) ?? null;
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * Makes a copy of the ruleset for a new base IRL. Replaces the base IRL in all role IDs.
   * @param {IRL} newBase 
   * @throws {TypeError}
   */
  copy(newBase){
    if (this.#base.equals(newBase)) throw new TypeError('base irl is the same');
    try {
      const 
      baseLength = `${this.#base}`.length;

      return new RoleSet({
        base: newBase, 
        value: this.#value.map(
          r => new Role({roleId: new RoleId(`${newBase}${r.roleId.toString().substring(baseLength)}`), description: r.description})
        )
      });
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

}


const
en = Language.fromCode('en'),
platformRoleset = new RoleSet()
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}unrestricted`,
    description: new I18nText().setText('The user can perform all actions in Qworum services.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}creator`,
    description: new I18nText().setText('The user can create primary data belonging to the group. Primary data are deliverables such as documents and collections of documents.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}editor`,
    description: new I18nText().setText('The user can update primary data belonging to the group. Primary data are deliverables such as documents and collections of documents.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}remover`,
    description: new I18nText().setText('The user can delete primary data belonging to the group. Primary data are deliverables such as documents and collections of documents.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}commentator`,
    description: new I18nText().setText('The user can comment on primary data belonging to the group. Primary data are deliverables such as documents and collections of documents. Comments are secondary data.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}private-creator`,
    description: new I18nText().setText('The user can create, edit and delete primary data that belongs to him/herself within the group, such as drafts of documents and collections. The user can also make such data available to the group, at which point the data is no longer private.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}communicator`,
    description: new I18nText().setText('The user can communicate with other users within the group and the partnership. Communication messages are secondary data.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}transferrer`,
    description: new I18nText().setText('The user can transfer primary non-private data from his/her group to another group within a partnership.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}importer`,
    description: new I18nText().setText('The user can upload data to the Qworum service.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}exporter`,
    description: new I18nText().setText('The user can download data from the Qworum service.', en)
  })
)
.setRole(
  new Role({
    roleId     : role_id`${RoleSet.platformBase}reader`,
    description: new I18nText().setText('The user has read-only access to primary and secondary data when using Qworum services.', en)
  })
);


export {Role, RoleSet, platformRoleset};
