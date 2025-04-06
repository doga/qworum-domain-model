// RDF
import { rdfTerm as t } from "../deps.mjs";
import { QRM, RDF } from "./util/rdf-prefixes.mjs";

import { OrgId, GroupId, UserId } from "./id.mjs";

/**
 * Represents a user in an org or a group (but not both).
 */
class Persona {
  /** @type {(OrgId | undefined)} */ orgId;
  /** @type {(GroupId | undefined)} */ groupId;
  /** @type {UserId} */ userId;
  /** @type {string[]} */ userRoles; // TODO should roles be rdf individuals (IRI etc)?
  
  /**
   * 
   * @param {{orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, userRoles: string[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
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
    if (!(persona.userRoles instanceof Array)) {
      throw new TypeError('Persona userRoles must be an array');
    }
    if (!persona.userRoles.every(role => typeof role === 'string')) {
      throw new TypeError('Persona userRoles must be an array of strings');
    }
    this.orgId     = persona.orgId;
    this.groupId   = persona.groupId;
    this.userId    = persona.userId;
    this.userRoles = persona.userRoles;
  }

  /**
   * Writes the persona to an RDF dataset.
   * @param {object} rdfDataset
   * @throws {Error}
   */
  writeTo(rdfDataset){
    const
    personaId = t.blankNode(),
    orgId     = this.orgId ? t.namedNode(`${this.orgId}`) : null,
    groupId   = this.groupId ? t.namedNode(`${this.groupId}`) : null,
    userId    = t.namedNode(`${this.userId}`),
    role      = t.namedNode(`${QRM}role`);

    rdfDataset.add(
      t.quad(personaId, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`))
    );
    if (orgId) {
      rdfDataset.add(
        t.quad(personaId, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}OrgPersona`))
      );
      rdfDataset.add(
        t.quad(personaId, t.namedNode(`${QRM}org`), orgId)
      );
    }
    if (groupId) {
      rdfDataset.add(
        t.quad(personaId, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}GroupPersona`))
      );
      rdfDataset.add(
        t.quad(personaId, t.namedNode(`${QRM}group`), groupId)
      );
    }
    rdfDataset.add(
      t.quad(personaId, t.namedNode(`${QRM}user`), userId)
    );
    for (const r of this.userRoles) {
      rdfDataset.add(
        t.quad(personaId, role, t.literal(r))
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
      personaIdsDataset = rdfDataset.match(
        null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Persona`)
      );
  
      // handle each persona
      for (const personaIdQuad of personaIdsDataset) {
        const
        personaIdTerm  = personaIdQuad.subject,
        orgIdDataset   = rdfDataset.match(personaIdTerm, t.namedNode(`${QRM}org`)),
        groupIdDataset = rdfDataset.match(personaIdTerm, t.namedNode(`${QRM}group`)),
        userIdDataset  = rdfDataset.match(personaIdTerm, t.namedNode(`${QRM}user`)),
        rolesDataset   = rdfDataset.match(personaIdTerm, t.namedNode(`${QRM}role`));
  
        // check for obvious data validity issues
        if (!(
          (orgIdDataset.size === 1 && groupIdDataset.size === 0) ||
          (orgIdDataset.size === 0 && groupIdDataset.size === 1)
        )) {
          throw new TypeError('Persona must have exactly one org or group.');
        }
        if (userIdDataset.size !== 1) {
          throw new TypeError('Persona must have exactly one user.');
        }
        if (rolesDataset.size === 0) {
          throw new TypeError('Persona must have at least one role.');
        }
  
        // read org or group id
        let orgId, groupId;
        if (orgIdDataset.size === 1) {
          for (const orgIdQuad of orgIdDataset) {
            const 
            orgIdTerm = orgIdQuad.object;
            orgId     = new OrgId(orgIdTerm.value);
          }
        } else {
          for (const groupIdQuad of groupIdDataset) {
            const 
            groupIdTerm = groupIdQuad.object;
            groupId     = new GroupId(groupIdTerm.value);
          }
        }

        // read user id
        let userId;
        for (const userIdQuad of userIdDataset) {
          const 
          userIdTerm = userIdQuad.object;
          userId     = new UserId(userIdTerm.value);
        }

        // read user userRoles
        const userRoles = [];
        for (const roleQuad of rolesDataset) {
          const 
          roleTerm = roleQuad.object;
          userRoles.push(roleTerm.value);
        }
  
        res.push(new Persona({orgId, groupId, userId, userRoles}));

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
   * @param {{orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, userRoles: string[]}} persona 
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
      orgId    : persona.orgId,
      userId   : persona.userId,
      userRoles: persona.userRoles
    }));

    return orgPersonas;
  }
}


class GroupPersona extends Persona {
  /**
   * 
   * @param {{orgId: OrgId | undefined, groupId: GroupId | undefined, userId: UserId, userRoles: string[]}} persona 
   * @throws {TypeError}
   */
  constructor(persona) {
    super(persona);
    if (persona.orgId) {
      throw new TypeError('OrgPersona cannot have an orgId');
    }
    if (!(persona.groupId && persona.groupId instanceof GroupId)) {
      throw new TypeError('OrgPersona must have a groupId');
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
      groupId  : persona.groupId,
      userId   : persona.userId,
      userRoles: persona.userRoles
    }));

    return orgPersonas;
  }
}


export { Persona, OrgPersona, GroupPersona };
