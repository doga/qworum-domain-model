import { rdfTerm as t, iri } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { UserId } from "./id.mjs";
import { Password } from "./user/password.mjs";
import { IndividualVcard } from "./vcard.mjs";

class User {
  /** @type {UserId} */ userId;
  /** @type {Password} */ password;
  /** @type {IndividualVcard} */ vcard;

  /** 
   * @type {{userId: UserId, password: Password, vcard: IndividualVcard | undefined}} user
   */
  constructor(user){
    this.userId   = user.userId;
    this.password = user.password;
    this.vcard    = user.vcard;
  }

  /**
   * @param {object} rdfDataset
   * @returns {User[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    res = [],
    userIdsDataset = rdfDataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}User`)
    );

    for (const userIdQuad of userIdsDataset) {
      const
      userIdTerm        = userIdQuad.subject,
      userId            = new UserId(userIdTerm.value),
      authIdDataset = rdfDataset.match(userIdTerm, t.namedNode(`${QRM}auth`));

      if (authIdDataset.size !== 1) {throw new TypeError('User must have exactly one auth.');}

      for (const authIdQuad of authIdDataset) {
        const
        authIdTerm      = authIdQuad.object,
        passwordDataset = rdfDataset.match(authIdTerm, t.namedNode(`${RDF}type`));
        
        if (passwordDataset.size !== 1) {
          throw new TypeError('Auth must have exactly one type.');
        }

        for (const authTypeQuad of passwordDataset) {
          const authTypeTerm = authTypeQuad.object;

          if (!authTypeTerm.equals(t.namedNode(`${QRM}Password`))) {
            throw new TypeError('Auth must have type Password.');
          }

          const
          passwordCleartextDataset = rdfDataset.match(authIdTerm, t.namedNode(`${QRM}passwordCleartext`));

          if (passwordCleartextDataset.size !== 1) {
            throw new TypeError('Password must have exactly one cleartext value.');
          }

          for (const passwordCleartextQuad of passwordCleartextDataset) {
            const password = new Password(iri`${authIdTerm.value}`, passwordCleartextQuad.object.value);
            res.push(new User({userId, password}));
          }
        }
          
      }

    }

    return res;
  }

  /**
   * @param {object} rdfDataset 
   */
  writeTo(rdfDataset){
    const
    userIdTerm = t.namedNode(`${this.userId}`),
    authIdTerm = t.namedNode(this.password.passwordId);
    
    rdfDataset.add(
      t.quad(userIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}User`))
    );
    rdfDataset.add(
      t.quad(userIdTerm, t.namedNode(`${QRM}auth`), authIdTerm)
    );
    rdfDataset.add(
      t.quad(authIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Password`))
    );
    rdfDataset.add(
      t.quad(authIdTerm, t.namedNode(`${QRM}passwordCleartext`), t.literal(this.password.passwordCleartext))
    );
  }

}

export { User };
