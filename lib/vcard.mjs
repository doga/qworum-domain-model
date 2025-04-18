// RDF
import { rdfTerm as t, IRI } from "../deps.mjs";
import { QRM, RDF, XSD, VCARD, SCHEMA } from "./util/rdf-prefixes.mjs";

// Vcard
import { ICAL as VcardParser } from "../deps.mjs";
import { Id, UserId, GroupId, OrgId } from "./id.mjs";

const 
itemIsString  = x => typeof x === 'string',
trimString    = s => s.trim()  ,
stringIsEmpty = s => s.length === 0;


/**
 * Name for an individual.
 */
class Name {
  /** @type {string[]} */
  #familyNames;
  /** @type {string[]} */
  #givenNames;
  /** @type {string[]} */
  #additionalNames;
  /** @type {string[]} */
  #honorificPrefixes;
  /** @type {string[]} */
  #honorificSuffixes;
  
  /** @returns {string[]} */
  get familyNames() {return this.#familyNames;}
  /** @returns {string[]} */
  get givenNames() {return this.#givenNames;}
  /** @returns {string[]} */
  get additionalNames() {return this.#additionalNames;}
  /** @returns {string[]} */
  get honorificPrefixes() {return this.#honorificPrefixes;}
  /** @returns {string[]} */
  get honorificSuffixes() {return this.#honorificSuffixes;}
  
  /**
   * Creates a name object for an individual.
   * @param {{familyNames: string[], givenNames: string[], additionalNames: string[], honorificPrefixes: string[], honorificSuffixes: string[]}} name 
   * @throws {TypeError}
   */
  constructor(name){
    if (!(
      typeof name === 'object' && !(name instanceof Array) &&
      name.familyNames instanceof Array       && name.familyNames.every(itemIsString) &&
      name.givenNames instanceof Array        && name.givenNames.every(itemIsString) &&
      name.additionalNames instanceof Array   && name.additionalNames.every(itemIsString) &&
      name.honorificPrefixes instanceof Array && name.honorificPrefixes.every(itemIsString) &&
      name.honorificSuffixes instanceof Array && name.honorificSuffixes.every(itemIsString)
    )) throw new TypeError('Invalid name');

    name.familyNames       = name.familyNames.map(trimString);
    name.givenNames        = name.givenNames.map(trimString);
    name.additionalNames   = name.additionalNames.map(trimString);
    name.honorificPrefixes = name.honorificPrefixes.map(trimString);
    name.honorificSuffixes = name.honorificSuffixes.map(trimString);

    if (
      name.familyNames.every(stringIsEmpty) &&
      name.givenNames.every(stringIsEmpty)
    ) throw new TypeError('Name is empty');

    this.#familyNames       = name.familyNames;
    this.#givenNames        = name.givenNames;
    this.#additionalNames   = name.additionalNames;
    this.#honorificPrefixes = name.honorificPrefixes;
    this.#honorificSuffixes = name.honorificSuffixes;
  }

  toString() {
    const
    honorificPrefixes = this.honorificPrefixes.join(' '),
    givenNames        = this.givenNames.join(' '),
    additionalNames   = this.additionalNames.join(' '),
    familyNames       = this.familyNames.join(' '),
    honorificSuffixes = this.honorificSuffixes.join(' ');

    let res = '';
    if (honorificPrefixes.length > 0) res += `${honorificPrefixes} `;
    if (givenNames.length > 0)        res += `${givenNames} `;
    if (additionalNames.length > 0)   res += `${additionalNames} `;
    if (familyNames.length > 0)       res += `${familyNames}`;
    if (honorificSuffixes.length > 0) res += `, ${honorificSuffixes}`;

    return res;
  }
}

class Types {
  /** @type {string[]} */
  #all;

  /**
   * @param {(string[] | string | null | undefined)} types
   */
  constructor(types) {
    if (typeof types === 'string') {
      types = [types];
    }
    if(!types)types = [];
    types = types?.map(type => type.toLowerCase()) ?? [];
    types = types.filter(type => ['home', 'work', 'voice', 'video', 'fax', 'cell'].includes(type));
    this.#all = types;
  }

  /**
   * @returns {string[]}
   */
  get all() {return this.#all;}
}

class EmailUrl extends URL {
  /** @type {string} */
  #emailStr;

  /**
   * 
   * @param {string} emailStr 
   */
  constructor(emailStr) {
    super(`mailto:${emailStr}`);
    this.#emailStr = emailStr;
  }

  get emailStr() {return this.#emailStr;}
}

class Email {
  /** @type {EmailUrl} */
  #emailUrl;
  /** @type {Types} */
  #types;

  /**
   * @param {EmailUrl} emailUrl  
   * @param {(Types | null | undefined)} types
   */
  constructor(emailUrl, types) {
    this.#emailUrl = emailUrl;
    this.#types = types ?? new Types();
  }

  /**
   * @returns {EmailUrl}
   */
  get url() {return this.#emailUrl;}

  /**
   * @returns {Types}
   */
  get types() {return this.#types;}
}

/**
 * Represents a Vcard photo.
 */
class Photo {
  /** @type {(string | null | undefined)} */
  #imageMimeType;
  /** @type {(URL | null | undefined)} */
  #url;
  /** @type {(string | null | undefined)} */
  #base64;

  /**
   * Creates a Vcard photo object.
   * @param {{imageMimeType: string | null | undefined, url: URL | null | undefined, base64: string | null | undefined, types: string[] | null | undefined}} photo
   * @throws {TypeError}
   */
  constructor(photo) {
    this.#imageMimeType = photo.imageMimeType;
    this.#url = photo.url;
    this.#base64 = photo.base64;
  }

  /** @returns {(URL | null | undefined)} */
  get imageMimeType() {return this.#imageMimeType;}

  /** @returns {(string | null | undefined)} */
  get url() {return this.#url;}

  /** @returns {(string | null | undefined)} */
  get base64() {return this.#base64;}

}

class PhoneUrl extends URL {
  /** @type {string} */
  #phoneNumber;

  /**
   * 
   * @param {string} phoneNumber 
   */
  constructor(phoneNumber) {
    phoneNumber = phoneNumber.replaceAll(/\s+/g, '-');
    super(`tel:${phoneNumber}`);
    this.#phoneNumber = phoneNumber;
  }

  get phoneNumber() {return this.#phoneNumber;}
}

class Phone {
  /** @type {PhoneUrl} */
  #phoneUrl;
  /** @type {Types} */
  #types;

  /**
   * @param {PhoneUrl} phoneUrl  
   * @param {(Types | null | undefined)} types
   */
  constructor(phoneUrl, types) {
    this.#phoneUrl = phoneUrl;
    this.#types = types ?? new Types();
  }

  /**
   * @returns {PhoneUrl}
   */
  get url() {return this.#phoneUrl;}

  /**
   * @returns {Types}
   */
  get types() {return this.#types;}
}


class Address {
  /** @type {string | undefined} */
  #streetAddress;
  /** @type {string | undefined} */
  #locality;
  /** @type {string | undefined} */
  #postalCode;
  /** @type {string | undefined} */
  #countryName;

  /**
   * 
   * @param {{streetAddress: string | undefined, locality: string | undefined, postalCode: string | undefined, countryName: string | undefined}} address 
   * @throws {TypeError}
   */
  constructor(address) {
    if (
      (typeof address?.streetAddress !== 'string') && 
      (typeof address?.locality !== 'string') && 
      (typeof address?.postalCode !== 'string') && 
      (typeof address?.countryName !== 'string')
    ) {
      throw new TypeError('Invalid address');
    }
    this.#streetAddress = address.streetAddress;
    this.#locality = address.locality;
    this.#postalCode = address.postalCode;
    this.#countryName = address.countryName;
  }

  get streetAddress() {return this.#streetAddress;}
  get locality() {return this.#locality;}
  get postalCode() {return this.#postalCode;}
  get countryName() {return this.#countryName;}
}


// TODO add more vcard fields, add "N" field allow more than one email etc, support field types (work, home)
// TODO vcards for orgs; they have the "N" field empty:
/* 
N:;;;;
FN:Balexert
ORG:Balexert;
*/
/**
 * Represents a Vcard.
 */
class Vcard { 
  /** 
   * @type {Id} 
   **/
  ownerId;
  /** @type {string} */
  formattedName;
  /** @type {string | undefined} */
  kind;
  /** @type {Name | undefined} */
  name;
  /** @type {string | undefined} */
  org;
  /** @type {(string | undefined)} */
  nickname;
  /** @type {Email[]} */
  emails;
  /** @type {Phone[]} */
  phones;
  /** @type {(Photo | undefined)} */
  photo;
  // /** @type {(Address | undefined)} */
  // address;
  


  /**
   * Creates a Vcard object.
   * @param {Id} ownerId 
   * @param {{formattedName: string, kind: string | undefined, name: Name | undefined, nickname: string | undefined, emails: Email[] | undefined, phones: Phone[] | undefined, photo: Photo | undefined, org: string | undefined}} vcard 
   * @throws {TypeError}
   */
  constructor(ownerId, vcard){
    // console.debug(`[Vcard.new] 2`, ownerId || 'no ownerId', vcard);
    if (
      (typeof vcard !== 'object' || vcard instanceof Array) ||
      !(typeof vcard.formattedName === 'string' && vcard.formattedName.trim().length > 0) ||
      (vcard.kind && !['individual', 'org', 'group'].includes(vcard.kind.toLowerCase())) || // vcard 4.0 https://datatracker.ietf.org/doc/html/rfc6350#section-6.1.4
      (!(ownerId instanceof IRI)) ||
      (vcard.name && !(vcard.name instanceof Name)) ||
      (vcard.org && !(typeof vcard.org === 'string' && vcard.org.trim().length > 0)) ||
      (vcard.nickname && (typeof vcard.nickname !== 'string' || vcard.nickname.trim().length === 0)) ||
      (vcard.emails && !(vcard.emails instanceof Array && vcard.emails.every(email => email instanceof Email))) ||
      (vcard.phones && !(vcard.phones instanceof Array && vcard.phones.every(phone => phone instanceof Phone))) ||
      (vcard.photo && !(vcard.photo instanceof Photo)) 
      // || (vcard.address && !(vcard.address instanceof Address))
    ) throw new TypeError('Invalid vcard');

    vcard.formattedName              = vcard.formattedName.trim();
    if(vcard.kind)vcard.kind         = vcard.kind.trim().toLowerCase();
    if(vcard.nickname)vcard.nickname = vcard.nickname.trim();
    if(vcard.org)vcard.org           = vcard.org.trim();

    if (
      (vcard.kind === 'individual' && !(ownerId instanceof UserId)) ||
      (vcard.kind === 'group' && !(ownerId instanceof GroupId)) ||
      (vcard.kind === 'org' && !(ownerId instanceof OrgId))
    ) {
      throw new TypeError('Mismatch between vCard kind and ownerId');
    }

    this.ownerId       = ownerId;
    this.formattedName = vcard.formattedName;
    this.kind          = vcard.kind;
    this.name          = vcard.name;
    this.org           = vcard.org;
    this.nickname      = vcard.nickname;
    this.emails        = vcard.emails ?? [];
    this.phones        = vcard.phones ?? [];
    this.photo         = vcard.photo;
    // this.#address = vcard.address;
  }

  /**
   * 
   * @param {string} vcardText 
   * @returns {{formattedName: string, kind: string | undefined, name: Name | undefined, nickname: string | undefined, emails: Email[] | undefined, phones: Phone[] | undefined, photo: Photo | undefined, org: string | undefined}} vcard 
   * @throws {TypeError}
   */
  static fromString(vcardText){
    if (!(typeof vcardText === 'string')) {
      throw new TypeError('Invalid vcardText');
    }
    try {
      const vcardRaw = VcardParser.parse(vcardText);

      // check input format
      if (!(
        vcardRaw instanceof Array ||
        vcardRaw.length === 2 ||
        vcardRaw[0] === 'vcard' ||
        vcardRaw[1] instanceof Array
      )) throw new TypeError('Invalid vcard');
      for (const item of vcardRaw[1]) {
        if (!(
          item instanceof Array &&
          item.length === 4 &&
          typeof item[0] === 'string' &&
          (typeof item[1] === 'object' && !(item[1] instanceof Array)) &&
          typeof item[2] === 'string'
        )) throw new TypeError('Invalid vcard');
      }

      // read kind
      let kind = vcardRaw[1].find(item => item[0].toLowerCase() === 'kind')
      if(kind)kind = kind[3];

      // read formatted name
      const formattedName = vcardRaw[1].find(item => item[0].toLowerCase() === 'fn')[3];

      // read name
      let name, nameInput = vcardRaw[1].find(item => item[0].toLowerCase() === 'n');
      if(nameInput){
        nameInput = nameInput[3];
        try {
          name = new Name({
            familyNames      : nameInput[0].split(','),
            givenNames       : nameInput[1].split(','),
            additionalNames  : nameInput[2].split(','),
            honorificPrefixes: nameInput[3].split(','),
            honorificSuffixes: nameInput[4].split(','),
          });
          kind = 'individual';
        } catch (_error) {
          // not a person vcard
        }
      }

      // read org
      let org, orgInput = vcardRaw[1].find(item => item[0].toLowerCase() === 'org');
      if(orgInput){
        orgInput = orgInput[3];
        if (orgInput instanceof Array){
          orgInput = orgInput.join(' ');
        }
        if (typeof orgInput === 'string') {
          orgInput = orgInput.trim();
          if (orgInput.length > 0) {
            org = orgInput;
          }
        }
      }

      // read nickname;
      let nickname = vcardRaw[1].find(item => item[0].toLowerCase() === 'nickname');
      if(nickname)nickname = nickname[3];

      // read emails
      let emails = vcardRaw[1]
      .filter(item => item[0].toLowerCase() === 'email')
      .map(email => new Email(new EmailUrl(email[3]), new Types(email[1].type)));

      // read phones
      let phones = vcardRaw[1]
      .filter(item => item[0].toLowerCase() === 'tel')
      .map(tel => new Phone(new PhoneUrl(tel[3]), new Types(tel[1].type)));

      // read photo
      let 
      photo = vcardRaw[1].find(item => item[0].toLowerCase() === 'photo'), 
      imageMimeType = 'application/octet-stream', imageBase64, imageUrl;
      if(photo){
        // image type 
        switch (photo[1].type?.toLowerCase()) {
          case 'jpeg':
          case 'jpg':
          case 'image/jpeg':
            imageMimeType = 'image/jpeg'; break;
          case 'png':
          case 'image/png':
            imageMimeType = 'image/png'; break;
          case 'svg':
          case 'image/svg+xml':
            imageMimeType = 'image/svg+xml'; break;
          case 'gif':
          case 'image/gif':
            imageMimeType = 'image/gif'; break;
          case 'webp':
          case 'image/webp':
            imageMimeType = 'image/webp'; break;
          case 'avif':
          case 'image/avif':
            imageMimeType = 'image/avif'; break;
          case 'bmp':
          case 'image/bmp':
            imageMimeType = 'image/bmp'; break;
          case 'apng':
          case 'image/apng':
            imageMimeType = 'image/apng'; break;
        }

        // image content
        if (photo[2] === 'binary') {
          // inline imageBase64 image
          imageBase64 = photo[3]; // TODO downscale
        } else {
          // if url scheme is 'data:' then the image is inline as well
          imageUrl = new URL(photo[3]);
        }

        photo = new Photo({imageMimeType, url: imageUrl, base64: imageBase64});
      }

      return {formattedName, kind, name, org, nickname, emails, phones, photo};

    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }

  /**
   * Writes the vCard to an RDF dataset. Vcards that don't have a ownerId are not written.
   * @param {object} rdfDataset
   * @throws {Error}
   */
  writeTo(rdfDataset){
    if (!this.ownerId) throw new Error("Vcard must have a ownerId");
    
    try {
      let vcardType = 'Individual';
      if (this.kind) {
        switch (this.kind) {
          case 'org':
            vcardType = 'Organization'; break;
          case 'group':
            vcardType = 'Group'; break;
          default:
            break;
        }
      } else if (!this.name) {
        vcardType = 'Organization';
      }
      
      const 
      ownerId    = t.namedNode(`${this.ownerId}`);
      rdfDataset.add(
        t.quad(
          ownerId,
          t.namedNode(`${RDF}type`), 
          t.namedNode(`${VCARD}VCard`),
        ),
      );
      rdfDataset.add(
        t.quad(
          ownerId,
          t.namedNode(`${RDF}type`), 
          t.namedNode(`${VCARD}${vcardType}`),
        ),
      );
      rdfDataset.add(
        t.quad(
          ownerId,
          t.namedNode(`${VCARD}fn`), 
          t.literal(this.formattedName),
        ), 
      );

      if (this.name) {
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}family-name`), 
            t.literal(this.name.familyNames.join(' ')),
          ),
        );
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}given-name`), 
            t.literal(this.name.givenNames.join(' ')),
          ),
        );
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}additional-name`), 
            t.literal(this.name.additionalNames.join(' ')),
          ),
        );
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}honorific-prefix`), 
            t.literal(this.name.honorificPrefixes.join(' ')),
          ),
        );
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}honorific-suffix`), 
            t.literal(this.name.honorificSuffixes.join(' ')),
          ),
        );
      }

      if (this.org) {
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}organization-name`), 
            t.literal(this.org),
          )
        );
      }

      if (this.nickname) {
        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}nickname`), 
            t.literal(this.nickname),
          )
        );
      }

      for (let i = 0; i < this.emails.length; i++) {
        const 
        email   = this.emails[i],
        // emailId = t.blankNode();
        emailId = t.namedNode(`${QRM}id/vcard/${userId.bareUserId}/email/${i+1}`);

        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}hasEmail`), 
            emailId,
          ),
        );
        rdfDataset.add(
          t.quad(
            emailId,
            t.namedNode(`${VCARD}hasValue`), 
            t.namedNode(`${email.url}`), 
          )
        );
        for (const emailType of email.types.all) {
          let rdfType;
          switch (emailType) {
            case 'home':
              rdfType = t.namedNode(`${VCARD}Home`); break;
            case 'work':
              rdfType = t.namedNode(`${VCARD}Work`); break;
          }
          if (rdfType) {
            rdfDataset.add(
              t.quad(
                emailId,
                t.namedNode(`${RDF}type`), 
                rdfType
              )
            );
          }
        }
      }

      for (let i = 0; i < this.phones.length; i++) {
        const 
        phone   = this.phones[i],
        // phoneId = t.blankNode();
        phoneId = t.namedNode(`${QRM}id/vcard/${userId.bareUserId}/phone/${i+1}`);

        rdfDataset.add(
          t.quad(
            ownerId,
            t.namedNode(`${VCARD}hasTelephone`), 
            phoneId,
          ),
        );
        rdfDataset.add(
          t.quad(
            phoneId,
            t.namedNode(`${VCARD}hasValue`), 
            t.namedNode(`${phone.url}`), 
          )
        );
        for (const phoneType of phone.types.all) {
          let rdfType;
          switch (phoneType) {
            case 'home':
              rdfType = t.namedNode(`${VCARD}Home`); break;
            case 'work':
              rdfType = t.namedNode(`${VCARD}Work`); break;
            case 'voice':
              rdfType = t.namedNode(`${VCARD}Voice`); break;
            case 'video':
              rdfType = t.namedNode(`${VCARD}Video`); break;
            case 'cell':
              rdfType = t.namedNode(`${VCARD}Cell`); break;
            case 'fax':
              rdfType = t.namedNode(`${VCARD}Fax`); break;
          }
          if (rdfType) {
            rdfDataset.add(
              t.quad(
                phoneId,
                t.namedNode(`${RDF}type`), 
                rdfType
              )
            );
          }
        }
      }

      if (this.photo) {
        if (this.photo.url) {
          rdfDataset.add(
            t.quad(
              ownerId,
              t.namedNode(`${RDF}hasPhoto`), 
              t.literal(`${this.photo.url}`, XSD.anyURI),
            )
          );
        } else {
          // const photoId = t.blankNode();
          const photoId = t.namedNode(`${QRM}id/vcard/${userId.bareUserId}/photo`);
          rdfDataset.add(
            t.quad(
              ownerId,
              t.namedNode(`${VCARD}hasPhoto`), 
              photoId,
            )
          );
          rdfDataset.add(
            t.quad(
              photoId,
              t.namedNode(`${RDF}type`),
              t.namedNode(`${SCHEMA}ImageObject`),
            )
          );
          rdfDataset.add(
            t.quad(
              photoId,
              t.namedNode(`${SCHEMA}encodingFormat`), 
              t.literal(this.photo.imageMimeType),
            )
          );
          rdfDataset.add(
            t.quad(
              photoId,
              t.namedNode(`${SCHEMA}contentUrl`),
              t.literal(
                `data:${this.photo.imageMimeType};base64,${this.photo.base64}`,
                `${XSD}anyURI`
              ),
              // t.literal(this.photo.base64, `${XSD}base64Binary`),
            )
          );
        }
      }

    } catch (error) {
      throw new Error(`${error}`);
    }
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {Vcard[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    try {
      const
      res = [],

      // detect vcards
      a = t.namedNode(`${RDF}type`),
      vcardTypeTerm = t.namedNode(`${VCARD}VCard`),
      ownerIdsDataset = rdfDataset.match(null, a, vcardTypeTerm);

      // handle each vcard
      for (const ownerIdQuad of ownerIdsDataset) {
        const
        ownerIdTerm      = ownerIdQuad.subject,
        vcardTypeDataset = rdfDataset.match(ownerIdTerm, a);

        let ownerId;
        try {
          ownerId = new UserId(ownerIdTerm.value);
        } catch (_error) {
          try {
            ownerId = new OrgId(ownerIdTerm.value);
          } catch (_error) {
            ownerId = new GroupId(ownerIdTerm.value);
          }
        }
        // console.debug(`[Vcard.readFrom] ownerId`, ownerId);

        // find vcard kind
        let kind = 'individual';
        for (const vcardTypeQuad of vcardTypeDataset) {
          if(vcardTypeQuad.object.equals(vcardTypeTerm))continue;
          if (vcardTypeQuad.object.equals(t.namedNode(`${VCARD}Organization`))) {
            kind = 'org';
          } else if (vcardTypeQuad.object.equals(t.namedNode(`${VCARD}Group`))) {
            kind = 'group';
          }
        }

        // find formatted name
        let formattedName;
        const fnDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}fn`));
        for (const fnQuad of fnDataset) {
          formattedName = fnQuad.object.value;
        }

        // find nickname
        let nickname;
        const nicknameDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}nickname`));
        for (const nnQuad of nicknameDataset) {
          nickname = nnQuad.object.value;
        }

        // find org
        let org;
        const orgDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}organization-name`));
        for (const orgQuad of orgDataset) {
          org = orgQuad.object.value;
        }

        // find name
        let name, familyNames = [], givenNames = [], additionalNames = [], honorificPrefixes = [], honorificSuffixes = [], nameExists = false;
        const familyNamesDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}family-name`));
        for (const familyNameQuad of familyNamesDataset) {
          familyNames.push(familyNameQuad.object.value.trim()); nameExists = true;
        }
        const givenNamesDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}given-name`));
        for (const givenNameQuad of givenNamesDataset) {
          givenNames.push(givenNameQuad.object.value.trim()); nameExists = true;
        }
        const additionalNamesDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}additional-name`));
        for (const additionalNamesQuad of additionalNamesDataset) {
          additionalNames.push(additionalNamesQuad.object.value.trim());
        }
        const honorificPrefixesDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}honorific-prefix`));
        for (const honorificPrefixesQuad of honorificPrefixesDataset) {
          honorificPrefixes.push(honorificPrefixesQuad.object.value.trim());
        }
        const honorificSuffixesDataset = rdfDataset.match(ownerIdTerm, t.namedNode(`${VCARD}honorific-suffix`));
        for (const honorificSuffixesQuad of honorificSuffixesDataset) {
          honorificSuffixes.push(honorificSuffixesQuad.object.value.trim());
        }
        if (nameExists) {
          name = new Name({
            familyNames,
            givenNames,
            additionalNames,
            honorificPrefixes,
            honorificSuffixes,
          });
        }

        res.push(new Vcard(ownerId, { // BUG omitted fields
          formattedName, kind, name, nickname, org,
          // emails, phones, photo, 
        }));

      }

      return res;
    } catch (error) {
      throw new TypeError(`${error}`);
    }
  }
}

/**
 * Vcard for individuals (as in "people").
 */
class IndividualVcard extends Vcard {
  /**
   * Creates a Vcard object.
   * @param {Id} ownerId 
   * @param {{formattedName: string, kind: string | undefined, name: Name | undefined, nickname: string | undefined, emails: Email[] | undefined, phones: Phone[] | undefined, photo: Photo | undefined, org: string | undefined}} vcard 
   * @throws {TypeError}
   */
  constructor(ownerId, vcard){
    super(ownerId, vcard);
  }

  /**
   * 
   * @param {Id} ownerId 
   * @param {string} vcardText 
   * @returns {IndividualVcard}
   * @throws {TypeError}
   */
  static fromString(ownerId, vcardText){
    const vcardInput = Vcard.fromString(vcardText);
    if (!vcardInput.name) {
      throw new TypeError("Individual must have a name");
    }
    return new IndividualVcard(ownerId, vcardInput);
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {IndividualVcard[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    vcards = Vcard.readFrom(rdfDataset)
    .filter(vcard => vcard.kind === 'individual')
    .map(vcard => new IndividualVcard(vcard.ownerId, {
      formattedName: vcard.formattedName,
      name         : vcard.name,
      kind         : vcard.kind,
      nickname     : vcard.nickname,
      emails       : vcard.emails,
      phones       : vcard.phones,
      photo        : vcard.photo,
      org          : vcard.org,
    }));

    return vcards;
  }
}


/**
 * Vcard for organisations.
 */
class OrgVcard extends Vcard {
  /**
   * Creates a Vcard object.
   * @param {Id} ownerId 
   * @param {{formattedName: string, kind: string | undefined, name: Name | undefined, nickname: string | undefined, emails: Email[] | undefined, phones: Phone[] | undefined, photo: Photo | undefined, org: string | undefined}} vcard 
   * @throws {TypeError}
   */
  constructor(ownerId, vcard){
    super(ownerId, vcard);
  }

  /**
   * 
   * @param {Id} ownerId 
   * @param {string} vcardText 
   * @returns {OrgVcard}
   * @throws {TypeError}
   */
  static fromString(ownerId, vcardText){
    const vcardInput = Vcard.fromString(vcardText);

    // Vcard 4.0
    if (vcardInput.kind) {
      if (vcardInput.kind.toLowerCase() !== 'org') {
        throw new TypeError("Not an org vcard");
      }
      return new OrgVcard(ownerId, vcardInput);
    }

    // Vcard 3.0
    if (vcardInput.name) {
      throw new TypeError("Org must not have a person name");
    }
    if (!vcardInput.org) {
      throw new TypeError("Org must not have an org name");
    }
    return new OrgVcard(ownerId, vcardInput);
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {OrgVcard[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    vcards = Vcard.readFrom(rdfDataset)
    .filter(vcard => vcard.kind === 'org')
    .map(vcard => new OrgVcard(vcard.ownerId, {
      formattedName: vcard.formattedName,
      name         : vcard.name,
      kind         : vcard.kind,
      nickname     : vcard.nickname,
      emails       : vcard.emails,
      phones       : vcard.phones,
      photo        : vcard.photo,
      org          : vcard.org,
    }));

    return vcards;
  }}


/**
 * Vcard for organisations.
 */
class GroupVcard extends Vcard {
  /**
   * Creates a Vcard object.
   * @param {Id} ownerId 
   * @param {{formattedName: string, kind: string | undefined, name: Name | undefined, nickname: string | undefined, emails: Email[] | undefined, phones: Phone[] | undefined, photo: Photo | undefined, org: string | undefined}} vcard 
   * @throws {TypeError}
   */
  constructor(ownerId, vcard){
    super(ownerId, vcard);
  }

  /**
   * 
   * @param {Id} ownerId 
   * @param {string} vcardText 
   * @returns {GroupVcard}
   * @throws {TypeError}
   */
  static fromString(ownerId, vcardText){
    const vcardInput = Vcard.fromString(vcardText);

    // Vcard 4.0
    if (vcardInput.kind) {
      if (vcardInput.kind.toLowerCase() !== 'group') {
        throw new TypeError("Not a group vcard");
      }
      return new GroupVcard(ownerId, vcardInput);
    }

    // Vcard 3.0
    if (vcardInput.name) {
      throw new TypeError("Org must not have a person name");
    }
    if (!vcardInput.org) {
      throw new TypeError("Org must not have an org name");
    }

    return new GroupVcard(ownerId, vcardInput);
  }

  /**
   * 
   * @param {object} rdfDataset 
   * @returns {GroupVcard[]}
   * @throws {TypeError}
   */
  static readFrom(rdfDataset){
    const 
    vcards = Vcard.readFrom(rdfDataset)
    .filter(vcard => vcard.kind === 'group')
    .map(vcard => new GroupVcard(vcard.ownerId, {
      formattedName: vcard.formattedName,
      name         : vcard.name,
      kind         : vcard.kind,
      nickname     : vcard.nickname,
      emails       : vcard.emails,
      phones       : vcard.phones,
      photo        : vcard.photo,
      org          : vcard.org,
    }));

    return vcards;
  }

}


export {
  Vcard, IndividualVcard, OrgVcard, GroupVcard,
  Name,
  Email, EmailUrl, 
  Phone, PhoneUrl, 
  Photo, 
  Address, 
};
