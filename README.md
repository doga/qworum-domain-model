<p align="left">
<a href="https://qworum.net" target="_blank" rel="noreferrer"><img src="https://github.com/doga/doga/raw/main/logos/Qworum-logo.svg" height="85" alt="Qworum" /></a>
</p>

# Qworum domain model

A JavaScript client library that provides classes that collectively represent Qworum's domain model. This library is/will be used by:

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
// TODO
```

Sample output for the code above:

```text

```

_Tip: Run the examples below by typing this in your terminal (requires [Deno](https://deno.com/) 2+):_

```shell
deno run --allow-net --allow-run --allow-env --allow-read jsr:@andrewbrey/mdrb@3.0.4 --dax=false --mode=isolated README.md
```

## Lifecycle of a domain model instance

1. On the client side, domain model instances are first put into an in-memory RDF dataset.
1. This dataset is then serialised into a text format before being sent to the server.
1. The server does the reverse, by using the same domain model.

What is meant by a client and a server:

- Client: a Qworum application or service. Server: the Qworum browser extension.
- Client: the Qworum browser extension. Server: the Qworum API in the cloud.

```mermaid
flowchart LR
  clientClass[Domain model class]
  clientInstance[Domain model instance]
  clientRdfDataset[RDF dataset]

  serverClass[Domain model class]
  serverInstance[Domain model instance]
  serverRdfDataset[RDF dataset]

  rdfSerialisation[RDF serialisation]

  subgraph Client
    clientClass <--> clientInstance
    clientInstance <--> clientRdfDataset
  end
  subgraph Server
    serverClass <--> serverInstance
    serverInstance <--> serverRdfDataset
  end
  clientRdfDataset <--> rdfSerialisation
  serverRdfDataset <--> rdfSerialisation
  
```

## Internal workings

The `ApiClient` class is available in `mod.mjs` and it is used directly for making API calls. The other classes don't make API calls behind the scenes. Each class has a `static from(rdfDataset)` method to create an object, except `ApiClient`. `ApiClient` imports all other classes.

```mermaid
---
title: Qworum domain model classes
---
classDiagram
  class Id{
    +string idType
    +string bareId
    +create(idString) Id$
    +equals(other) boolean
  }
  class UserId{
    +create(idString) UserId$
  }
  class GroupId{
    +create(idString) GroupId$
  }
  class OrgId{
    +create(idString) OrgId$
  }
  class User{
    +UserId userId
    +Password password
    +IndividualVcard vcard?
    +readFrom(rdfDataset) User[]$
    +writeTo(rdfDataset)
  }
  class Group{
    +GroupId groupId
    +OrgId orgId?
    +GroupId parentGroupId?
    +GroupId[] collabs
    +GroupVcard vcard?
    +readFrom(rdfDataset) Group[]$
    +writeTo(rdfDataset)
  }
  class Org{
    +OrgId orgId
    +OrgVcard vcard?
    +readFrom(rdfDataset) Org[]$
    +writeTo(rdfDataset)
  }
  class Persona{
    +OrgId orgId?
    +GroupId groupId?
    +UserId userId
    +string[] roles
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
    +IRI vcardId?
    +string formattedName
    ...
    +readFrom(rdfDataset) Vcard[]$
    +writeTo(rdfDataset)
    +fromString(str) Vcard$
    +toString() string
  }
  class IndividualVcard{
    +readFrom(rdfDataset) IndividualVcard[]$
    +fromString(str) IndividualVcard$
  }
  class GroupVcard{
    +readFrom(rdfDataset) GroupVcard[]$
    +fromString(str) GroupVcard$
  }
  class OrgVcard{
    +readFrom(rdfDataset) OrgVcard[]$
    +fromString(str) OrgVcard$
  }

  note for Persona "One of orgId or groupId is required, but not both."
  note for User "Vcard excluded from serialization?"
  note for Vcard "The only objects that can be generated on the client"

  Id --|> URN : extends
  URN --|> IRI
  UserId --|> Id
  OrgId --|> Id
  GroupId --|> Id
  IndividualVcard --|> Vcard
  GroupVcard --|> Vcard
  OrgVcard --|> Vcard
  PersonalGroup --|> Group
  OrgPersona --|> Persona
  GroupPersona --|> Persona
  Org *-- OrgVcard
  Group *-- GroupVcard
  User *-- IndividualVcard
  Persona --> User
  Persona --> Group
  Persona --> Org
  User *-- Password : has part

  style Id fill:#595,stroke:#333,stroke-width:4px
  style UserId fill:#595,stroke:#333,stroke-width:4px
  style GroupId fill:#595,stroke:#333,stroke-width:4px
  style OrgId fill:#595,stroke:#333,stroke-width:4px
  style Password fill:#595,stroke:#333,stroke-width:4px
  style User fill:#595,stroke:#333,stroke-width:4px
  style Vcard fill:#595,stroke:#333,stroke-width:4px
  style IndividualVcard fill:#595,stroke:#333,stroke-width:4px
  style GroupVcard fill:#595,stroke:#333,stroke-width:4px
  style OrgVcard fill:#595,stroke:#333,stroke-width:4px
  style Persona fill:#595,stroke:#333,stroke-width:4px
  style OrgPersona fill:#595,stroke:#333,stroke-width:4px
  style GroupPersona fill:#595,stroke:#333,stroke-width:4px
```

`Persona` roles are 'owner', 'root groups manager', 'subgroups manager', 'collabs manager', 'memberships manager', 'member'.

```mermaid
---
title: Domain modelling for Qworum
---
flowchart LR
  ApiClient
  Persona -- has part --> User
  Group -- has part --> User
  Persona -- has part --> Group
  User -- creates --> Group
  User -- creates --> Org

  subgraph Users
    User -- creates --> IndividualVcard
    User -- has part --> IndividualVcard
    User -- has part --> Password
  end
  subgraph Groups and Orgs
    Group -- has part --> GroupVcard
    Group -- part of --> Org
    Org -- has part --> Group
    Org -- has part --> OrgVcard
  end
```

```mermaid
---
title: Dependencies between the internal JavaScript modules
---
flowchart LR
  mod[mod.mjs]
  deps[deps.mjs]
  id[id.mjs]
  rdfPrefixes[rdf-prefixes.mjs]
  vcard[vcard.mjs]
  auth[auth.mjs]
  password[password.mjs]
  apiClient[api-client.mjs]
  group[group.mjs]
  user[user.mjs]
  userdata[userdata.mjs]

  subgraph User
    user -- imports --> password
    password -- imports --> auth
  end

  mod -- imports --> id
  mod -- imports --> user
  mod -- imports --> userdata
  mod -- imports --> password
  mod -- imports --> vcard
  mod -- imports --> group
  id -- imports --> deps
  vcard -- imports --> deps
  vcard -- imports --> id
  vcard -- imports --> rdfPrefixes
  password -- imports --> deps
  password -- imports --> rdfPrefixes
  apiClient -- imports --> deps
  user -- imports --> deps
  user -- imports --> id
  user -- imports --> rdfPrefixes
  user -- imports --> group
  user -- imports --> vcard
  user -- imports --> apiClient
  group -- imports --> deps
  group -- imports --> rdfPrefixes
  group -- imports --> id
  group -- imports --> vcard
  group -- imports --> apiClient
  userdata -- imports --> id
  userdata -- imports --> password
  userdata -- imports --> apiClient
  userdata -- imports --> vcard
  userdata -- imports --> deps
```

```mermaid
---
title: External dependencies
---
flowchart LR
  deps[deps.mjs]
  iri[@doga/IRI]
  rdfTerms[@rdfjs/data-model]
  rdfDataset[@rdfjs/dataset]
  rdfJson[@doga/rdf-json-parser]
  base64[@doga/base64]
  ical[@kewisch/ical.js]

  deps -- imports --> iri
  deps -- imports --> rdfTerms
  deps -- imports --> rdfDataset
  deps -- imports --> rdfJson
  deps -- imports --> base64
  deps -- imports --> ical

  click base64 "https://github.com/doga/base64" _blank
  click iri "https://github.com/doga/IRI" _blank
  click rdfJson "https://github.com/doga/rdf-json-parser" _blank
  click rdfTerms "https://github.com/rdfjs/data-model" _blank
  click rdfDataset "https://github.com/rdfjs/dataset" _blank
  click ical "https://github.com/kewisch/ical.js" _blank
```

## User journeys

TODO Org groups manager journey.

### Typical user journey for a simple user

The user is initially assigned all roles within his/her personal group:

- owner
- membership manager
- collab manager
- member

Personal groups don't have a `subgroups manager` role.

```mermaid
journey
  section Create user profile
    Start: 5: End-user
    Create profile ID and password: 5: Platform
    Create personal group: 5: Platform
    Set Vcard for profile: 5: End-user
  section Choose persona (profile+group) for signing into Qworum application
    Choose profile: 5: End-user
    Choose group: 5: End-user
```

### Typical user journey for a group owner

The group owner is initially also assigned all other roles within the group:

- membership manager
- collab manager
- member

```mermaid
journey
  section Create group
    Start: 5: End-user
    Create group: 5: Platform
    End-user is assigned all group roles: 5: Platform
    Update roles within group: 5: End-user
    Add/remove other managers: 5: End-user
    Add/remove other owners: 5: End-user
    Set Vcard for group: 5: End-user
```

### Typical user journey for a membership manager

TODO: member roles.

```mermaid
journey
  section Update group memberships
    Add user profiles: 5: End-user
    Remove user profiles: 5: End-user
```

### Typical user journey for a collab manager

Collabs are for multi-group teamwork. Collab connections must be 2-way to be valid, the others are only collab proposals pending confirmation by the other party.

```mermaid
journey
    section Update collab connections
      Add collab link to another group: 5: End-user
      Remove collab link to another group: 5: End-user
```

### Typical user journey for a subgroups manager

A group can have subgroups. Subgroup members are a members of the parent group; no such restriction for admin roles.

```mermaid
journey
    section Update subgroups
      Create a subgroup: 5: End-user
      Fill admin roles in subgroup: 5: End-user
      Delete a subgroup: 5: End-user
```

∎
