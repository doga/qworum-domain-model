<p align="left">
<a href="https://qworum.net" target="_blank" rel="noreferrer"><img src="https://github.com/doga/doga/raw/main/logos/Qworum-logo.svg" height="85" alt="Qworum" /></a>
</p>

# Qworum domain model

A JavaScript client library that provides classes that collectively represent Qworum's domain model. The focus is on the usage of Qworum applications/services. The primary classes that are defined are:

- `Org`,
- `Group`,
- `Collab`,
- `User`.

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
  class IRL{
    +URL url
  }
  class Id{
    +string idType
    +string bareId
    +create(idString) Id$
    +random() Id$
  }
  class UserId{
    +create(idString) UserId$
    +random() UserId$
  }
  class GroupId{
    +create(idString) GroupId$
    +random() GroupId$
  }
  class CollabId{
    +create(idString) CollabId$
    +random() CollabId$
  }
  class OrgId{
    +create(idString) OrgId$
    +random() OrgId$
  }
  class User{
    +UserId userId
    +GroupId personalGroupId
    +Password password
    +readFrom(rdfDataset) User[]$
    +writeTo(rdfDataset)
    +equals(other) boolean
  }
  class Group{
    +GroupId groupId
    +boolean isPersonalGroup?
    +OrgId orgId?
    +GroupId parentGroupId?
    +CollabId collabId?
    +readFrom(rdfDataset) Group[]$
    +writeTo(rdfDataset)
    +equals(other) boolean
  }
  class Collab {
    +CollabId collabId
    +GroupId ownerGroupId
    +GroupId[] memberGroupIds
    +readFrom(rdfDataset) Collab[]$
    +writeTo(rdfDataset)
    +equals(other) boolean
  }
  class Org{
    +OrgId orgId
    +readFrom(rdfDataset) Org[]$
    +writeTo(rdfDataset)
    +equals(other) boolean
  }
  class Persona{
    +OrgId orgId?
    +GroupId groupId?
    +UserId userId
    +UserRole[] userRoles
    +readFrom(rdfDataset) Persona[]$
    +writeTo(rdfDataset)
  }
  class OrgPersona{
    +readFrom(rdfDataset) OrgPersona[]$
  }
  class GroupPersona{
    +readFrom(rdfDataset) GroupPersona[]$
  }
  class Password{
    +IRI passwordId
    +string passwordCleartext
  }
  class Vcard{
    +Id ownerId
    +string kind
    +string formattedName
    ...
    +readFrom(rdfDataset) Vcard[]$
    +writeTo(rdfDataset)
    -fromString(vcardString) object
    +toString() string
  }
  class IndividualVcard{
    +readFrom(rdfDataset) IndividualVcard[]$
    +fromString(ownerId, vcardString) IndividualVcard$
  }
  class GroupVcard{
    +readFrom(rdfDataset) GroupVcard[]$
    +fromString(ownerId, vcardString) GroupVcard$
  }
  class OrgVcard{
    +readFrom(rdfDataset) OrgVcard[]$
    +fromString(ownerId, vcardString) OrgVcard$
  }

  note for Collab "Only groups that link back are in the collab."
  note for Persona "One of orgId or groupId is set."
  note for User "Vcard excluded from serialization?"
  note for Vcard "The only objects that can be generated on the client"
  note for PersonalGroup "Does not have org or parent/sub groups."

  Id --|> URN : extends
  URN --|> IRI
  IRL --|> IRI
  UserRole --|> IRL
  UserId --|> Id
  OrgId --|> Id
  GroupId --|> Id
  CollabId --|> Id
  IndividualVcard --|> Vcard
  GroupVcard --|> Vcard
  OrgVcard --|> Vcard
  PersonalGroup --|> Group
  OrgPersona --|> Persona
  GroupPersona --|> Persona
  Org *-- OrgVcard : has vCard
  Group *-- GroupVcard : has vCard
  Collab *-- Group
  User *-- IndividualVcard : has vCard
  Persona -- User
  Persona -- Group
  Persona -- Org
  Persona -- UserRole
  User *-- Password : has password

  style Id fill:#229,stroke:#333,stroke-width:4px
  style UserId fill:#229,stroke:#333,stroke-width:4px
  style GroupId fill:#229,stroke:#333,stroke-width:4px
  style CollabId fill:#229,stroke:#333,stroke-width:4px
  style OrgId fill:#229,stroke:#333,stroke-width:4px
  style UserRole fill:#E3342C,stroke:#333,stroke-width:4px

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

  style Persona fill:#E3342C,stroke:#333,stroke-width:4px
  style OrgPersona fill:#E3342C,stroke:#333,stroke-width:4px
  style GroupPersona fill:#E3342C,stroke:#333,stroke-width:4px
```

In a `Persona`, allowed user roles are _owner_, _root groups manager_ (for orgs), _subgroups manager_ (for groups that are not personal groups), _collabs manager_ (for all groups), _memberships manager_, _member_. All roles except _member_ are manager roles. Managers and members are collectively called _participants_.

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
Create a persona that assigns roles to a user within an organisation.
'''
</pre>
</details>

```typescript
import rdf from 'https://esm.sh/gh/rdfjs/dataset@v2.0.2';

import { 
  OrgId, bareorgid, bareuserid,
  OrgPersona, ownerRole, rootGroupsManagerRole, subgroupsManagerRole, collabManagerRole, membershipsManagerRole, memberRole,
} from 'https://esm.sh/gh/doga/qworum-domain-model@0.9.2/mod.mjs';

type PersonaType = {
  orgId    : any,
  groupId  : any,
  userId   : any,
  userRoles: any,
};

// Create a persona that assigns roles to a user within an organisation.
const
orgId     = bareorgid`w-5678`,
userId    = bareuserid`r-1234`,
userRoles = [ownerRole, rootGroupsManagerRole, membershipsManagerRole, memberRole],
personaIn = new OrgPersona({orgId, userId, userRoles} as PersonaType),
dataset   = rdf.dataset();

// Write the persona to an RDF dataset and read it back.
personaIn.writeTo(dataset);
const orgPersonas = OrgPersona.readFrom(dataset);

// Print out the persona.
console.group(`Org ID: ${orgId}`);
for (const persona of orgPersonas) {
  console.group(`User ID: ${persona.userId}`);
  console.group('Role IDs:');
  for (const userRole of persona.userRoles) {
    console.debug(`${userRole}`);
  }
  console.groupEnd();
  console.groupEnd();
}
console.groupEnd();
```

Sample output for the code above:

```text
Org ID: urn:qworum:org:w-5678
    User ID: urn:qworum:user:r-1234
        Role IDs:
            https://vocab.qworum.net/id/role/owner
            https://vocab.qworum.net/id/role/root-groups-manager
            https://vocab.qworum.net/id/role/memberships-manager
            https://vocab.qworum.net/id/role/member
```

### Running the usage example

Run the examples above by typing this in your terminal (requires [Deno](https://deno.com/) 2+):

```shell
deno run --allow-net --allow-run --allow-env --allow-read jsr:@andrewbrey/mdrb@3.0.4 --dax=false --mode=isolated https://raw.githubusercontent.com/doga/qworum-domain-model/refs/heads/main/README.md
```

∎
