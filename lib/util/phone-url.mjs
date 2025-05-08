

class PhoneUrl extends URL {
  /** @type {string} */
  #phoneNumber;

  get phoneNumber() {return this.#phoneNumber;}

  /**
   * 
   * @param {string} phoneUrl 
   * @throws {TypeError}
   */
  constructor(phoneUrl) {
    try {
      super(phoneUrl);
      if (this.protocol !== 'tel:') {
        throw new Error("not a phone url");
      }

      this.#phoneNumber = this.pathname;
    } catch (error) {
      // console.debug(`[PhoneUrl new] error`,error);
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {{phoneNumber: string}} info 
   * @throws {TypeError}
   */
  static build(info) {
    try {
      const phoneNumber = info.phoneNumber.replaceAll(/\s+/g, '-');
      return new PhoneUrl(`tel:${phoneNumber}`);
    } catch (error) {
      // console.debug(`[PhoneUrl build] error`,error);
      // console.debug(`[PhoneUrl build] info`,info);
      throw new TypeError(`${error}`);
    }
  }

}

export default PhoneUrl;
export {PhoneUrl};
