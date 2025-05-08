
// TODO support subject and body fields etc? https://en.wikipedia.org/wiki/Mailto

class EmailUrl extends URL {
  /** @type {string} */
  #emailAddress;

  get emailAddress() {return this.#emailAddress;}

  /**
   * 
   * @param {string} phoneUrl 
   * @throws {TypeError}
   */
  constructor(phoneUrl) {
    try {
      super(phoneUrl);
      if (this.protocol !== 'mailto:') {
        throw new Error("not an email url");
      }

      this.#emailAddress = this.pathname;
    } catch (error) {
      // console.debug(`[EmailUrl new] error`,error);
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {{emailAddress: string}} info 
   * @throws {TypeError}
   */
  static build(info) {
    try {
      return new EmailUrl(`mailto:${info.emailAddress}`);
    } catch (error) {
      // console.debug(`[EmailUrl build] error`,error);
      // console.debug(`[EmailUrl build] info`,info);
      throw new TypeError(`${error}`);
    }
  }

}


export default EmailUrl;
export {EmailUrl};
