
// TODO implement the full spec https://datatracker.ietf.org/doc/html/rfc2397

class DataUrl extends URL {
  /** @type {string} */
  #contentType;
  
  /** @type {string} */
  #base64Content;

  get contentType(){return this.#contentType;}
  get base64Content(){return this.#base64Content;}

  /**
   * 
   * @param {string} dataUrl 
   * @throws {TypeError}
   */
  constructor(dataUrl) {
    try {
      super(dataUrl);
      if (this.protocol !== 'data:') {
        throw new Error("not a data url");
      }

      const
      dataUrlPattern = /^data:(?<contentType>[^;]+);base64,(?<base64Content>\S+)$/,
      match          = dataUrl.match(dataUrlPattern);
      // console.debug(`[DataUrl new] match`,match);

      if (!match) {
        throw new Error("unrecognised data url");
      }
      this.#contentType   = match.groups.contentType,
      this.#base64Content = match.groups.base64Content;
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * 
   * @param {{contentType: string, base64Content: string}} data
   * @throws {TypeError}
   */
  static build(data) {
    try {
      return new DataUrl(`data:${data.contentType};base64,${data.base64Content}`);
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

}

export default DataUrl;
export {DataUrl};
