<p align="left">
<a href="https://qworum.net" target="_blank" rel="noreferrer"><img src="https://github.com/doga/doga/raw/main/logos/Qworum-logo.svg" height="85" alt="Qworum" /></a>
</p>

# Qworum domain model

A JavaScript client library that provides classes that collectively represent Qworum's domain model. The focus is on the usage of Qworum applications/services. The primary classes that are defined are:

- `Org`,
- `Group`,
- `Collab`,
- `User`.

Each domain object can be read from, and written to, an [RDF dataset](https://rdf.js.org/dataset-spec/#datasetcore-interface).

This library is/will be used by:

- Qworum's API server at the backend.
- The [Qworum browser extension](https://chromewebstore.google.com/detail/qworum-the-service-web/leaofcglebjeebmnmlapbnfbjgfiaokg).
- The [Qworum JavaScript library](https://github.com/doga/qworum-for-web-pages) that is used for developing Qworum applications and services.

## Domain model in detail

```mermaid
---
title: Qworum domain model classes
---
classDiagram
  class IRI{
    +equals(other) boolean
    +toString() string
  }
  class Id{
    +string idType
    +string bareId
    +create(idString) Id$
    +uuid() Id$
  }
  class UserId{
    +create(idString) UserId$
    +uuid() UserId$
  }
  class PasswordId{
    +forUser(userId) PasswordId$
  }
  class GroupId{
    +create(idString) GroupId$
    +uuid() GroupId$
  }
  class CollabId{
    +create(idString) CollabId$
    +uuid() CollabId$
  }
  class OrgId{
    +create(idString) OrgId$
    +uuid() OrgId$
  }
  class PersonaId{
    +create(idString) OrgId$
    +uuid() OrgId$
  }

  class User{
    +UserId userId
    +GroupId personalGroupId
    +Password password
    +readFrom(dataset) User[]$
    +writeTo(dataset)
    +toDataset() object
    +equals(other) boolean
  }
  class Group{
    +GroupId groupId
    +boolean isPersonalGroup
    +OrgId orgId?
    +GroupId parentGroupId?
    +CollabId collabId?
    +UserId[] ownerIds
    +UserId[] subgroupsManagerIds
    +UserId[] collabManagerIds
    +UserId[] membershipsManagerIds
    +UserId[] memberIds
    +readFrom(dataset) Group[]$
    +writeTo(dataset)
    +toDataset() object
    +equals(other) boolean
  }
  class Collab{
    +CollabId collabId
    +GroupId ownerGroupId
    +GroupId[] invitedGroupIds
    +readFrom(dataset) Collab[]$
    +writeTo(dataset)
    +toDataset() object
    +equals(other) boolean
  }
  class Org{
    +OrgId orgId
    +UserId[] ownerIds
    +UserId[] rootGroupsManagerIds
    +UserId[] membershipsManagerIds
    +UserId[] memberIds
    +readFrom(dataset) Org[]$
    +writeTo(dataset)
    +toDataset() object
    +equals(other) boolean
  }
  class Persona{
    +PersonaId personaId
    +UserId userId
    +GroupId groupId
    +MemberRole[] memberRoles
    +readFrom(dataset) Persona[]$
    +writeTo(dataset)
    +toDataset() object
    +equals(other) boolean
  }
  class Vcard{
    +Id ownerId
    +string kind
    +string formattedName
    ...
    +readFrom(dataset) Vcard[]$
    +writeTo(dataset)
    +toDataset() object
    -fromString(vcardString) object
    +toString() string
  }
  class IndividualVcard{
    +readFrom(dataset) IndividualVcard[]$
    +fromString(ownerId, vcardString) IndividualVcard$
  }
  class GroupVcard{
    +readFrom(dataset) GroupVcard[]$
    +fromString(ownerId, vcardString) GroupVcard$
  }
  class OrgVcard{
    +readFrom(dataset) OrgVcard[]$
    +fromString(ownerId, vcardString) OrgVcard$
  }

  class Password{
    +IRI passwordId
    +string passwordCleartext
  }

  note for Collab "Only groups that link back are in the collab."
  note for Group "In an org, only top-level groups must have an orgId."
  note for Vcard "The only objects that can be generated on the client"
  note for PersonalGroup "Does not have an org or parent/sub groups. Owner cannot be removed, new owners cannot be added."
  note for Persona "Makes an enforceable statement about a user's membership in a group or org."

  Id --|> IRI : extends
  MemberRole --|> IRI
  UserId --|> Id
  PasswordId --|> Id
  PersonaId --|> Id
  OrgId --|> Id
  GroupId --|> Id
  CollabId --|> Id
  IndividualVcard --|> Vcard
  GroupVcard --|> Vcard
  OrgVcard --|> Vcard
  PersonalGroup --|> Group
  Org *-- OrgVcard : has vCard
  Group *-- GroupVcard : has vCard
  Group -- User : member
  Group -- User : owner
  Group -- User : subgroups manager
  Group -- User : collab manager
  Group -- User : memberships manager
  Org -- User : owner
  Org -- User : root groups manager
  Org -- User : memberships manager
  Org -- User : member
  Persona -- MemberRole
  Persona -- Group
  Persona -- User
  Collab *-- Group
  User *-- IndividualVcard : has vCard
  User *-- Password : has password

  style Id fill:#229,stroke:#333,stroke-width:4px
  style UserId fill:#229,stroke:#333,stroke-width:4px
  style PasswordId fill:#229,stroke:#333,stroke-width:4px
  style GroupId fill:#229,stroke:#333,stroke-width:4px
  style CollabId fill:#229,stroke:#333,stroke-width:4px
  style OrgId fill:#229,stroke:#333,stroke-width:4px
  style PersonaId fill:#229,stroke:#333,stroke-width:4px

  style Org fill:#641DA4,stroke:#333,stroke-width:4px
  style Group fill:#6D1FB3,stroke:#333,stroke-width:4px
  style Collab fill:#005B9B,stroke:#333,stroke-width:4px
  style PersonalGroup fill:#6D1FB3,stroke:black,stroke-width:4px
  style User fill:#641DA4,stroke:#333,stroke-width:4px
  style Password fill:#616161,stroke:#333,stroke-width:4px

  style Vcard fill:#292,stroke:#333,stroke-width:4px
  style IndividualVcard fill:#292,stroke:#333,stroke-width:4px
  style GroupVcard fill:#292,stroke:#333,stroke-width:4px
  style OrgVcard fill:#292,stroke:#333,stroke-width:4px

  style MemberRole fill:#AE251C,stroke:#333,stroke-width:4px
  style Persona fill:#AE251C,stroke:#333,stroke-width:4px
```

In a `Group` or `Org`, the allowed user roles are _owner_, _root groups manager_ (for orgs), _subgroups manager_ (for groups that are not personal groups), _collab manager_ (for all groups), _memberships manager_, _member_. All roles except _member_ are manager roles. Managers and members are collectively called _participants_.

By default, a group membership grants the user full permissions when using Qworum-based services. User permissions may be made more restrictive through `Persona` annotations on group membership relations. For example a group member may be given a read-only access to Qworum-based services.
Note that Qworum's definition of what a `role` or a `permission` is differs slightly from the conventional use of those terms. Indeed, traditionally [roles are bags of permissions](https://www.ibm.com/docs/en/ram/7.5.4.5?topic=management-roles-permissions), and each role and permission is application-specific, which means that two applications may use very different sets of roles and permissions, and even if two applications use the same tag name for a role or permission, the meaning that each application attaches to those tags can vary considerably. In contrast, with `Persona` Qworum aims to establish a roles & permissions framework that is common to all applications and services.

Note that personas are only one type of membership annotation. For instance, annotations may serve membership activation purposes. For example:

- A group membership may be active only for a given time period.
- A group membership may be activated only after a certain event has occurred.

```mermaid
flowchart TD
  o[Organisation]
  g[Group]
  oo[Org owner]
  rgm[Root groups manager]
  omm[Memberships manager]
  go[Group owner]
  sm[Subgroups manager]
  cm[Collab manager]
  m[Member]
  r[Reader]

  o -- manager role --> oo
  o -- manager role --> rgm
  o -- manager role --> omm
  g -- manager role --> go
  g -- manager role --> sm
  g -- manager role --> cm
  o  -- membership role with full permissions --> m
  g  -- membership role with full permissions --> m
  m  -- restrictive membership role --> r
```

The members of a group are all members of the parent group or org. If a group belongs to an org, then all managers of the group must be members of the org. If a group doesn't belong to an org, then anyone can be a group manager if the group owner sees it fit.

Collabs are for multi-group teamwork. Collab connections must be 2-way to be valid, the others are only collab proposals pending confirmation by the other party. Here is how it works:

1. A collab manager in a group creates a collab object and adds the IDs of groups that he/she wishes to invite to the collab.
1. Any previous collab object that the group was linking to is forgotten by that group. Groups can link to one collab at most at any given time.
1. The collab managers of the invited groups are notified and can link their group to the collab.
1. A collab is for Internet-wide teamwork; it is valid for all Qworum applications.

## Lifecycle of a domain model

1. On the client side, domain model instances are first put into an in-memory RDF dataset.
1. This dataset is then serialised into a text format before being sent to the server.
1. The server does the reverse, by using the same domain model.

What is meant by a client and a server:

- Client: a Qworum application or service. Server: the Qworum browser extension.
- Client: the Qworum browser extension. Server: the Qworum API in the cloud.

The following are out-of-scope for this domain model:

- RDF serialisation,
- Data persistence.

```mermaid
flowchart LR
  domainModelClass[Domain model classes created during architecting phase]

  clientInstance[Class instances used during operations]
  clientRdfDataset[RDF dataset]
  clientRdfSerialisation[RDF serialisation]
  clientStorage[Client-side storage]

  serverInstance[Class instances used during operations]
  serverRdfDataset[RDF dataset]
  serverRdfSerialisation[RDF serialisation]
  rdfStore[RDF store]

  domainModelClass -- instantiation --> clientInstance
  domainModelClass -- instantiation --> serverInstance

  subgraph Client
    clientInstance -- output --> clientRdfDataset
    clientRdfDataset -- input --> clientInstance
    clientRdfDataset -- to text --> clientRdfSerialisation
    clientRdfSerialisation -- from text --> clientRdfDataset
    clientRdfSerialisation <-- data persistence --> clientStorage
  end
  subgraph Server
    serverInstance -- output --> serverRdfDataset
    serverRdfDataset -- input --> serverInstance
    serverRdfDataset -- to text --> serverRdfSerialisation
    serverRdfSerialisation -- from text --> serverRdfDataset
    serverRdfDataset <-- data persistence --> rdfStore
  end

  clientRdfSerialisation <--network--> serverRdfSerialisation
```

## Usage example

<details data-mdrb>
<summary>Handle personas</summary>

<pre>
description = '''
Restrict the role of a group member to a read-only capacity.
'''
</pre>
</details>

```javascript
import { 
  IriParser, IRI, iri, URN, urn, IRL, irl, url, 
  Id, OrgId, orgid, GroupId, groupid, CollabId, collabid, UserId, userid, PersonaId, personaid,
  Org, Group, PersonalGroup, Collab, Password, User,
  Vcard, IndividualVcard, GroupVcard, OrgVcard, Name, Email, EmailUrl, Phone, PhoneUrl, Photo, Address, 
  Persona, OrgPersona, GroupPersona, MemberRole, memberrole,
} from 'https://esm.sh/gh/doga/qworum-domain-model@0.9.15/mod.mjs';

import rdf from 'https://esm.sh/gh/rdfjs/dataset@v2.0.2';

// Create a persona that assigns a read-only role to a user within a group.
const
groupId     = GroupId.uuid(),
userId      = UserId.uuid(),
memberRoles = [ MemberRole.reader ],
persona     = new Persona({groupId, userId, memberRoles}),
dataset     = rdf.dataset();

// Store in in-memory RDF dataset
persona.writeTo(dataset);

// Read from in-memory RDF dataset
const personas = Persona.readFrom(dataset);

// Print out the persona.
for (const persona of personas) {
  console.info(`Group: ${persona.groupId}`);
  console.info(`User:  ${persona.userId}`);
  console.group('Roles:');
  for (const role of persona.memberRoles) {
    console.info(`${role}`);
  }
  console.groupEnd();
}
```

Sample output for the code above:

```text
Group: urn:qworum:group:4f5aca14-150b-4bc6-82a1-d06d932cea09
User:  urn:qworum:user:fbc797e5-796d-417e-b1ae-c682c83a61ba
Roles:
    https://vocab.qworum.net/id/memberrole/reader
```

### Running the usage example

Run the example above by typing this in your terminal (requires [Deno](https://deno.com/) 2+):

```shell
deno run --allow-net --allow-run --allow-env --allow-read jsr:@andrewbrey/mdrb@3.0.4 --dax=false --mode=isolated https://raw.githubusercontent.com/doga/qworum-domain-model/refs/heads/main/README.md
```

∎
