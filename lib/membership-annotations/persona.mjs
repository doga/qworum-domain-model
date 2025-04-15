// RDF
import { iri, IRI, IRL, rdfTerm as t } from "../../deps.mjs";
import { QRM, RDF } from "../util/rdf-prefixes.mjs";

import { OrgId, GroupId, UserId, PersonaId, orgid, groupid, userid, personaid, } from "../id.mjs";
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
 * Represents a user in an org or a group (but not both).
 */
class Persona {
  /** @type {PersonaId} */ personaId;
  /** @type {(OrgId | undefined)} */ orgId;
  /** @type {(GroupId | undefined)} */ groupId;
  /** @type {UserId} */ userId;
  /** @type {MemberRole[]} */ memberRoles;
  
  /**
   * 
   * @param {{personaId: PersonaId | undefined, orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, memberRoles: MemberRole[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    if (!(typeof persona === 'object' && !(persona instanceof Array))) {
      throw new TypeError('argument must be an object');
    }
    if (persona.personaId && !(persona.personaId instanceof PersonaId)) {
      throw new TypeError('Persona type must be a PersonaId');
    }
    if (!persona.orgId && !persona.groupId) {
      throw new TypeError('Persona must have an orgId or a groupId');
    }
    if (persona.orgId && persona.groupId) {
      throw new TypeError('Persona cannot have both an orgId and a groupId');
    }
    if (persona.orgId && !(persona.orgId instanceof OrgId)) {
      throw new TypeError('Persona orgId must be an OrgId');
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
      throw new TypeError('Persona memberRoles must be an array of UserRoles');
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
    orgIdTerm         = this.orgId ? t.namedNode(`${this.orgId}`) : null,
    groupIdTerm       = this.groupId ? t.namedNode(`${this.groupId}`) : null,
    userIdTerm        = t.namedNode(`${this.userId}`),
    memberRolesTerm   = t.namedNode(`${QRM}memberRole`),
    membershipRelTerm = t.quad(orgIdTerm ?? groupIdTerm, t.namedNode(`${QRM}member`), userIdTerm);

    // reification
    rdfDataset.add(membershipRelTerm);
    rdfDataset.add(
      t.quad(membershipRelTerm, t.namedNode(`${QRM}persona`), personaIdTerm)
    );

    // persona
    rdfDataset.add(
      t.quad(personaIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`))
    );
    if (orgIdTerm) {
      rdfDataset.add(
        t.quad(orgIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`))
      );
      rdfDataset.add(
        t.quad(personaIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}OrgPersona`))
      );
    }
    if (groupIdTerm) {
      rdfDataset.add(
        t.quad(groupIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Group`))
      );
      rdfDataset.add(
        t.quad(personaIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}GroupPersona`))
      );
    }

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
        userId = userid`${membershipQuad.object.value}`,

        // is the membership for an org or a group?
        isOrgDs        = rdfDataset.match(membershipQuad.subject, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Org`)),
        isOrg        = isOrgDs.size === 1,
        orgId        = isOrg ? orgid`${membershipQuad.subject.value}` : null,
        groupId      = isOrg ? null : groupid`${membershipQuad.subject.value}`,

        // find the persona for the membership (ideally there is only one)
        personaIdsDs = rdfDataset.match(membershipQuad, t.namedNode(`${QRM}persona`)),
        memberRoles = [];

        // read user roles
        for (const personaIdQuad of personaIdsDs) {
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

          res.push(new Persona({personaId, orgId, groupId, userId, memberRoles}));
        }

      }

      return res;      
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }
}


class OrgPersona extends Persona {
  /**
   * 
   * @param {{personaId: PersonaId | undefined, orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, memberRoles: MemberRole[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    super(persona);
    if (!(persona.orgId && persona.orgId instanceof OrgId)) {
      throw new TypeError('OrgPersona must have an orgId');
    }
    if (persona.groupId) {
      throw new TypeError('OrgPersona cannot have a groupId');
    }
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {OrgPersona[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    personas = super.readFrom(rdfDataset),

    orgPersonas = personas
    .filter(persona => persona.orgId instanceof OrgId)
    .map(persona => new OrgPersona({
      orgId      : persona.orgId,
      userId     : persona.userId,
      memberRoles: persona.memberRoles
    }));

    return orgPersonas;
  }
}


class GroupPersona extends Persona {
  /**
   * 
   * @param {{personaId: PersonaId | undefined, orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, memberRoles: MemberRole[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    super(persona);
    if (persona.orgId) {
      throw new TypeError('GroupPersona cannot have an orgId');
    }
    if (!(persona.groupId && persona.groupId instanceof GroupId)) {
      throw new TypeError('GroupPersona must have a groupId');
    }
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {GroupPersona[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    personas = super.readFrom(rdfDataset),

    orgPersonas = personas
    .filter(persona => persona.groupId instanceof GroupId)
    .map(persona => new GroupPersona({
      groupId    : persona.groupId,
      userId     : persona.userId,
      memberRoles: persona.memberRoles
    }));

    return orgPersonas;
  }
}


export {
  MemberRole, memberrole,
  Persona, OrgPersona, GroupPersona, 
};
