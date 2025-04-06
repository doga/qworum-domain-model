// export {
//   RDF, RDFS, XSD, 
//   VCARD, DCE, 
//   QRM, SCHEMA,
// } from './lib/util/rdf-prefixes.mjs'; // ??

export {iri, irl, urn, url, IRI, URN, IRL} from "./deps.mjs";
export { Id, OrgId, GroupId, UserId} from './lib/id.mjs';
export { User } from './lib/user.mjs';
export { Persona, OrgPersona, GroupPersona } from './lib/persona.mjs';
export { Password } from './lib/user/password.mjs';
export {
  Vcard, IndividualVcard, OrgVcard, GroupVcard,
  Name,
  Email, EmailUrl, 
  Phone, PhoneUrl, 
  Photo, 
  Address, 
} from './lib/vcard.mjs';

