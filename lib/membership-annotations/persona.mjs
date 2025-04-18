// RDF
import { iri, IRI, IRL, rdfTerm as t } from "../../deps.mjs";
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
class Persona {
  /** @type {PersonaId} */ personaId;
  /** @type {GroupId} */ groupId;
  /** @type {UserId} */ userId;

  /** 
   * List of member roles. When using Qworum services, the user is permitted to do any action
   * that any of the listed roles allows. An empty list means full permissions.
   * @type {MemberRole[]} 
   **/ 
  memberRoles;
  
  /**
   * 
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
    this.personaId   = persona.personaId ?? PersonaId.uuid();
    this.orgId       = persona.orgId;
    this.groupId     = persona.groupId;
    this.userId      = persona.userId;
    this.memberRoles = persona.memberRoles;
  }

  /**
   * Writes the persona to an RDF dataset.
   * @param {object} rdfDataset
   * @throws {Error}
   */
  writeTo(rdfDataset){
    const
    personaIdTerm     = t.namedNode(`${this.personaId}`),
    groupIdTerm       = t.namedNode(`${this.groupId}`),
    userIdTerm        = t.namedNode(`${this.userId}`),
    memberRolesTerm   = t.namedNode(`${QRM}memberRole`),
    membershipRelTerm = t.quad(groupIdTerm, t.namedNode(`${QRM}member`), userIdTerm);

    // reification
    rdfDataset.add(membershipRelTerm);
    rdfDataset.add(
      t.quad(membershipRelTerm, t.namedNode(`${QRM}persona`), personaIdTerm)
    );

    // persona
    rdfDataset.add(
      t.quad(personaIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`))
    );
    rdfDataset.add(
      t.quad(groupIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
    );

    // user roles
    for (const userRoleId of this.memberRoles) {
      rdfDataset.add(
        t.quad(personaIdTerm, memberRolesTerm, t.namedNode(`${userRoleId}`))
      );
    }

  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {Persona[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    try {
      const 
      res = [],
      membershipsDs = rdfDataset.match(null, t.namedNode(`${QRM}member`));

      for (const membershipQuad of membershipsDs) {
        const
        groupId = groupid`${membershipQuad.subject.value}`, // assume it's not an org
        userId  = userid`${membershipQuad.object.value}`,

        // find the persona for the membership (ideally there is only one)
        personaIdsDs = rdfDataset.match(membershipQuad, t.namedNode(`${QRM}persona`));

        // read member roles
        for (const personaIdQuad of personaIdsDs) {
          // definitely not an org membership, only group memberships have personas

          // 
          const
          personaIdTerm = personaIdQuad.object,
          personaId     = personaid`${personaIdTerm.value}`,
          rolesDs       = rdfDataset.match(personaIdTerm, t.namedNode(`${QRM}memberRole`));

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
}

export {
  MemberRole, memberrole,
  Persona,
};
