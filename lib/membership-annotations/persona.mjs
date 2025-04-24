// RDF
import { iri, IRI, IRL, rdfTerm as t, rdf } from "../../deps.mjs";
import { QRM, RDF } from "../util/rdf-prefixes.mjs";

import { GroupId, UserId, PersonaId, groupid, userid, personaid, } from "../id.mjs";
import ttg from "../util/tagged-template-generator.mjs";


class MemberRole extends IRI {
  /** 
   * A membership role that confers its holder a read-only access to group data.
   * @type {MemberRole}
   **/
  static reader = new MemberRole(`${QRM}id/memberrole/reader`);

  /**
   *  
   * @param {string} roleId 
   */
  constructor(roleId) {
    super(`${roleId}`);
  }  
}


/** 
 * Tagged-template parser for MemberRole.
 * @type {function} 
 * @param {string} stringValue
 * @returns {MemberRole?}
 **/
const memberrole = ttg(MemberRole);



/**
 * Represents a user in a group.
 */
class Persona { // BUG/limitation: does not ensure that user is a group manager or a group member
  /** 
   * ID can be undefined because if a group member has the default role
   * then there is need to store a persona in an RDF store, 
   * but the browser will still need to handle personas.
   * @type {(PersonaId|undefined)} 
   **/
  personaId; // make an ID mandatory? when is storing personas not required?

  /** @type {GroupId} */ groupId;
  /** @type {UserId} */ userId;

  /** 
   * List of member roles. When using Qworum services, the user is permitted to do any action
   * that any of the listed roles allows. An empty list means full permissions.
   * @type {MemberRole[]} 
   **/ 
  memberRoles;
  
  /**
   * Be aware that unless the persona has an ID it will not be writable to an RDF dataset.
   * @param {{personaId: PersonaId | undefined, groupId: GroupId, userId: UserId, memberRoles: MemberRole[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    if (!(typeof persona === 'object' && !(persona instanceof Array))) {
      throw new TypeError('argument must be an object');
    }
    if (persona.personaId && !(persona.personaId instanceof PersonaId)) {
      throw new TypeError('Persona type must be a PersonaId');
    }
    if (!persona.groupId) {
      throw new TypeError('Persona must have a groupId');
    }
    if (persona.groupId && !(persona.groupId instanceof GroupId)) {
      throw new TypeError('Persona groupId must be a GroupId');
    }
    if (!(persona.userId instanceof UserId)) {
      throw new TypeError('Persona userId must be a UserId');
    }
    if (!(persona.memberRoles instanceof Array)) {
      throw new TypeError('Persona memberRoles must be an array');
    }
    if (!persona.memberRoles.every(role => role instanceof MemberRole)) {
      throw new TypeError('Persona memberRoles must be an array of MemberRoles');
    }
    this.personaId   = persona.personaId;
    this.orgId       = persona.orgId;
    this.groupId     = persona.groupId;
    this.userId      = persona.userId;
    this.memberRoles = persona.memberRoles;
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
   * Writes the persona to an RDF dataset.
   * @param {object} dataset
   * @throws {Error}
   */
  writeTo(dataset){
    if (!this.personaId) {
      throw new Error("Persona must have an ID to be written to a dataset.");
    }
    const
    personaIdTerm     = t.namedNode(`${this.personaId}`),
    groupIdTerm       = t.namedNode(`${this.groupId}`),
    userIdTerm        = t.namedNode(`${this.userId}`),
    memberRolesTerm   = t.namedNode(`${QRM}memberRole`),
    membershipRelTerm = t.quad(groupIdTerm, t.namedNode(`${QRM}member`), userIdTerm);

    // reification
    dataset.add(membershipRelTerm);
    dataset.add(
      t.quad(membershipRelTerm, t.namedNode(`${QRM}persona`), personaIdTerm)
    );

    // persona
    dataset.add(
      t.quad(personaIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`))
    );
    dataset.add(
      t.quad(groupIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
    );

    // user roles
    for (const userRoleId of this.memberRoles) {
      dataset.add(
        t.quad(personaIdTerm, memberRolesTerm, t.namedNode(`${userRoleId}`))
      );
    }

  }

  /**
   * 
   * @param {object} dataset 
   * @returns {Persona[]}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    try {
      const 
      res = [],
      membershipsDs = dataset.match(null, t.namedNode(`${QRM}member`));

      for (const membershipQuad of membershipsDs) {
        const
        groupId = groupid`${membershipQuad.subject.value}`, // assume it's not an org
        userId  = userid`${membershipQuad.object.value}`,

        // find the persona for the membership (ideally there is only one)
        personaIdsDs = dataset.match(membershipQuad, t.namedNode(`${QRM}persona`));

        // read member roles
        for (const personaIdQuad of personaIdsDs) {
          // definitely not an org membership, only group memberships have personas

          // 
          const
          personaIdTerm = personaIdQuad.object,
          personaId     = personaid`${personaIdTerm.value}`,
          rolesDs       = dataset.match(personaIdTerm, t.namedNode(`${QRM}memberRole`));

          const memberRoles = [];
          for (const roleQuad of rolesDs) {
            const 
            roleTerm = roleQuad.object,
            role     = memberrole`${roleTerm.value}`;

            if (!role) {
              throw new Error(`Invalid member role: ${roleTerm.value}`);
            }
            memberRoles.push(role);
          }

          res.push(new Persona({personaId, groupId, userId, memberRoles}));
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
   * @returns {(Persona|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const personas = Persona.readFrom(dataset);
      if (personas.length === 0) {
        return null;
      }
      return personas[0];
    } catch (_error) {
      return null;
    }
  }

}

export {
  MemberRole, memberrole,
  Persona,
};
