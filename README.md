<p align="left">
<a href="https://qworum.net" target="_blank" rel="noreferrer"><img src="https://github.com/doga/doga/raw/main/logos/Qworum-logo.svg" height="85" alt="Qworum" /></a>
</p>

# Qworum domain model

A JavaScript client library that provides classes that collectively represent Qworum's domain model. The focus is on the usage of Qworum applications/services. The primary classes that are defined are:

- `Org`,
- `Group`,
- `User`.

This library is/will be used by:

- Qworum's API server at the backend.
- The [Qworum browser extension](https://chromewebstore.google.com/detail/qworum-the-service-web/leaofcglebjeebmnmlapbnfbjgfiaokg).
- The [Qworum JavaScript library](https://github.com/doga/qworum-for-web-pages) that is used for developing Qworum applications and services.

## Usage examples

<details data-mdrb>
<summary>Calling an API endpoint</summary>

<pre>
description = '''

'''
</pre>
</details>

```javascript
import {User} from "./mod.mjs";
// TODO usage example
```

Sample output for the code above:

```text

```

_Tip: Run the examples below by typing this in your terminal (requires [Deno](https://deno.com/) 2+):_

```shell
deno run --allow-net --allow-run --allow-env --allow-read jsr:@andrewbrey/mdrb@3.0.4 --dax=false --mode=isolated README.md
```

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
  }
  class UserId{
    +create(idString) UserId$
  }
  class GroupId{
    +create(idString) GroupId$
  }
  class CollabId{
    +create(idString) CollabId$
  }
  class OrgId{
    +create(idString) OrgId$
  }
  class User{
    +UserId userId
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

Collabs are for multi-group teamwork. Collab connections must be 2-way to be valid, the others are only collab proposals pending confirmation by the other party.

∎
