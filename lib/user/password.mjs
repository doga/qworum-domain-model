import { IRI } from "../../deps.mjs";

class Password {
  /** @type {IRI} */ #passwordId;
  /** @type {string} */ passwordCleartext;

  /**
   * @returns {IRI}
   */
  get passwordId(){return this.#passwordId;}

  /**
   * @param {IRI} passwordId
   * @param {string} passwordCleartext 
   */
  constructor(passwordId, passwordCleartext){
    if (!(
      passwordId instanceof IRI &&
      typeof passwordCleartext === 'string'
    )) {
      throw new TypeError("Invalid password");
    }
    this.#passwordId        = passwordId;
    this.passwordCleartext = passwordCleartext;
  }

  /**
   * 
   * @param {*} other 
   * @returns {boolean}
   */
  equals(other) {
    if (!(other instanceof Password)) return false;
    return this.passwordId.equals(other.passwordId);
  }

  /** @returns {string} */
  toString(){return `Password(cleartext: ${this.passwordCleartext})`;}
}

export {Password};
