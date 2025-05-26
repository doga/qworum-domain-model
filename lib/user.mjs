import { rdfTerm as t, rdf, iri } from "../deps.mjs";
import { QRM, RDF } from "../lib/util/rdf-prefixes.mjs";
import { UserId, user_id, GroupId, group_id, baregroup_id, PasswordId, } from "./id.mjs";
import { Password } from "./user/password.mjs";

class User {
  /** @type {UserId} */ #userId;
  /** @type {GroupId} */ #personalGroupId;
  /** @type {Password} */ password;

  /**
   * @returns {UserId}
   */
  get userId(){return this.#userId;}

  /**
   * @returns {GroupId}
   */
  get personalGroupId(){return this.#personalGroupId;}

  /** 
   * @param {{userId: UserId | undefined, personalGroupId: GroupId, password: Password}} user
   */
  constructor(user){
    this.#userId          = user.userId ?? UserId.uuid();
    this.#personalGroupId = user.personalGroupId;
    this.password        = user.password;
  }

  /**
   * Create a new user that has a random ID and a random password.
   * @returns {User}
   */
  static create(){ // TODO create from {userId, passwordCleartext}
    const 
    userId            = UserId.uuid(),
    personalGroupId   = baregroup_id`${userId.bareId}`,
    passwordId        = PasswordId.forUser(userId),
    passwordCleartext = crypto.randomUUID(),
    password          = new Password(passwordId, passwordCleartext),
    user              = new User({userId, personalGroupId, password});

    return user;
  };

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof User)) return false;
    return this.userId.equals(other.userId);
  }

  /**
   * 
   * @param {object} dataset
   * @returns {User[]}
   * @throws {TypeError}
   */
  static readFrom(dataset){
    const 
    res = [],
    userIdsDataset = dataset.match(
      null, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}User`)
    );

    for (const userIdQuad of userIdsDataset) {
      const
      userIdTerm           = userIdQuad.subject,
      userId               = user_id`${userIdTerm.value}`,
      personalGroupDataset = dataset.match(userIdTerm, t.namedNode(`${QRM}personalGroup`)),
      authIdDataset        = dataset.match(userIdTerm, t.namedNode(`${QRM}auth`));

      // read personal group
      let personalGroupId;
      if (!(personalGroupDataset.size === 1)) {
        throw new TypeError(`User must have exactly one personal group but had ${personalGroupDataset.size}.`);
      }
      for (const parentGroupIdQuad of personalGroupDataset) {
        const parentGroupIdTerm = parentGroupIdQuad.object;
        personalGroupId = group_id`${parentGroupIdTerm.value}`;
      }

      // read auth
      let password;
      if (!(authIdDataset.size === 1)) {
        throw new TypeError(`User must have exactly one auth but had ${authIdDataset.size}.`);
      }
      for (const authIdQuad of authIdDataset) {
        const
        authIdTerm      = authIdQuad.object,
        passwordDataset = dataset.match(authIdTerm, t.namedNode(`${RDF}type`));
        
        if (passwordDataset.size !== 1) {
          throw new TypeError(`Auth must have exactly one type but had ${passwordDataset.size}.`);
        }

        for (const authTypeQuad of passwordDataset) {
          const authTypeTerm = authTypeQuad.object;

          if (!authTypeTerm.equals(t.namedNode(`${QRM}Password`))) {
            throw new TypeError('Auth must have type Password.');
          }

          const
          passwordCleartextDataset = dataset.match(authIdTerm, t.namedNode(`${QRM}passwordCleartext`));

          if (passwordCleartextDataset.size !== 1) {
            throw new TypeError('Password must have exactly one cleartext value.');
          }

          for (const passwordCleartextQuad of passwordCleartextDataset) {
            password = new Password(new PasswordId(`${authIdTerm.value}`), passwordCleartextQuad.object.value);
            // password = new Password(iri`${authIdTerm.value}`, passwordCleartextQuad.object.value);
          }
        }
      }
      res.push(new User({userId, personalGroupId, password}));
    }

    return res;
  }

  /**
   * 
   * @param {object} dataset 
   * @returns {(User|null)}
   * @see {@link https://rdf.js.org/dataset-spec/#datasetcore-interface | DatasetCore interface}
   */
  static readOneFrom(dataset){
    try {
      const users = User.readFrom(dataset);
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
    userIdTerm          = t.namedNode(`${this.userId}`),
    authIdTerm          = t.namedNode(`${this.password.passwordId}`),
    personalGroupIdTerm = t.namedNode(`${this.personalGroupId}`);
    
    dataset.add(
      t.quad(userIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}User`))
    );

    // personal group
    dataset.add(
      t.quad(userIdTerm, t.namedNode(`${QRM}personalGroup`), personalGroupIdTerm)
    );

    // auth
    dataset.add(
      t.quad(userIdTerm, t.namedNode(`${QRM}auth`), authIdTerm)
    );
    dataset.add(
      t.quad(authIdTerm, t.namedNode(`${RDF}type`), t.namedNode(`${QRM}Password`))
    );
    dataset.add(
      t.quad(authIdTerm, t.namedNode(`${QRM}passwordCleartext`), t.literal(this.password.passwordCleartext))
    );
  }

}

export { User };
