
import { 
  rdfTerm as t, rdf,
  Language, 
} from '../../deps.mjs';

import { RDF, QRM } from "../util/rdf-prefixes.mjs";
import { I18nText } from "../util/i18n-text.mjs";
import { RoleId, role_id } from "../id.mjs";


/**
 * Defines a user role within a group.
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
      const text = this.description.getTextForLang(lang);
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
        roleId     = new RoleId(roleIdTerm.value);

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
            
            description.setTextForLang(lang, text);
          } catch (error) {
            
          }
        }

        res.push(new Role({roleId, description}));
      } catch (_error) {
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

const
en = Language.fromCode('en'),
wellKnownRoles = {
  unrestricted: new Role({
    roleId: role_id`${QRM}id/role/unrestricted`,
    description: new I18nText().setTextForLang('The user can perform all actions in Qworum services.', en)
  }),

  reader: new Role({
    roleId: role_id`${QRM}id/role/reader`,
    description: new I18nText().setTextForLang('The user has read-only access to data when using Qworum services.', en)
  }),
};


export default Role;
export {Role, wellKnownRoles};
