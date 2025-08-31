/**
 * `Qworum domain model` is a JavaScript library that defines how Qworum applications deal with the end-users.
 * 
 * Chief among the concepts defined and/or supported here are:
 * - The {@link Persona}, consisting of a {@link Group} and a {@link User} who is acting on behalf of the group.
 * - {@link Partnership}s between groups, through which multiple groups can merge into a single virtual group, thereby facilitating cross-team and cross-org scenarios.
 * - {@link Role}s which are used by group memberships managers for defining what the users are permitted to do when using an application on behalf of a particular group. Roles are also used by partnership managers to define what a group is allowed to do within a partnership; in this case the group roles are a mask over the roles of the group's users.
 * - A group-centric model of data ownership, where the group owns the data produced within a Qworum application or service, rather than the end-user.
 * 
 * @module Qworum domain model
 * @author Doğa Armangil <d.armangil@qworum.net>
 * @license  Apache-2.0 <https://www.apache.org/licenses/LICENSE-2.0>
 * @example How to create a user.
 * ```javascript
 * // The user is created in-memory, without publishing it to the global Qworum database.
 * import { 
 *   User, UserId, GroupId, Password, PasswordId
 * } from 'https://esm.sh/gh/doga/qworum-domain-model@0.35.0/mod.mjs';
 * const user = User.create();
 * user;                     // a User instance
 * user.userId;              // a UserId instance
 * user.password;            // a Password instance
 * user.password.passwordId; // a PasswordId instance
 * user.personalGroupId;     // a GroupId instance
 * ```
 * @example How to create a group of users.
 * ```javascript
 * // The group is created in-memory, without publishing it to the global Qworum database.
 * import {
 *   Group, GroupId, OrgId, UserId, UserIdSet
 * } from 'https://esm.sh/gh/doga/qworum-domain-model@0.35.0/mod.mjs';
 * const
 * ownerIds      = new UserIdSet().add(UserId.uuid()).add(UserId.uuid()),
 * orgId         = OrgId.uuid(),
 * parentGroupId = GroupId.uuid(),
 * // Create the group with a random groupId.
 * group         = new Group({
 *   orgId, parentGroupId,
 *   ownerIds, 
 *   subgroupsManagerIds    : ownerIds,
 *   partnershipsManagersIds: ownerIds,
 *   membershipsManagerIds  : ownerIds,
 *   memberIds              : ownerIds
 * });
 * ```
 * @example How to create a partnership between groups.
 * ```javascript
 * // The partnership is created in-memory, without publishing it to the global Qworum database.
 * import {
 *   Partnership, PartnershipId, GroupId 
 * } from 'https://esm.sh/gh/doga/qworum-domain-model@0.35.0/mod.mjs';
 * const
 * ownerId     = GroupId.uuid(),
 * memberIds   = new GroupIdSet().add(ownerId).add(GroupId.uuid()).add(GroupId.uuid()),
 * // Create the partnership with a random partnershipId.
 * partnership = new Partnership({ ownerId, memberIds });
 * ```
 * @see {@link https://github.com/doga/qworum-domain-model | GitHub repository}
 * @see {@link https://qworum.net/en/developers/ | Qworum developer resources}
 */

import { 
  IriParser,
  IRI, URN, IRL, 
  iri, urn, irl, url, 
} from "./deps.mjs";

import { 
  Id, OrgId, GroupId, UserId, PasswordId, MembershipId, PartnershipId, PartnershipMembershipId,
  org_id, group_id, user_id, membership_id, partnership_id, partnership_membership_id,
  bareorg_id, baregroup_id, bareuser_id, barepartnership_id,
  UserIdSet, GroupIdSet,
} from './lib/id.mjs';

import { Org, Group, PersonalGroup } from './lib/group.mjs';
import { Partnership } from './lib/partnership.mjs';
import { Password } from './lib/user/password.mjs';
import { UserExtras } from './lib/user/extras.mjs';
import { User } from './lib/user.mjs';

import { Membership } from './lib/membership-annotations/membership.mjs';
import { PartnershipMembership } from './lib/membership-annotations/partnership-membership.mjs';
import { Role, Roleset, defaultRoleset } from './lib/membership-annotations/role.mjs';
import { I18nText } from "./lib/util/i18n-text.mjs";
import { Language } from "./deps.mjs";

import {
  Vcard, IndividualVcard, GroupVcard, OrgVcard, Name, Email, Phone, Photo, Address, Types,
} from './lib/vcard.mjs';

import { DataUrl } from "./lib/util/data-url.mjs";
import { EmailUrl } from "./lib/util/email-url.mjs";
import { PhoneUrl } from "./lib/util/phone-url.mjs";

import { Persona } from './lib/persona.mjs';

export { 
  IriParser, IRI, iri, URN, urn, IRL, irl, url, 

  Id, OrgId, GroupId, UserId, PasswordId, MembershipId, PartnershipId, PartnershipMembershipId,
  org_id, group_id, user_id, membership_id, partnership_id, partnership_membership_id,
  bareorg_id, baregroup_id, bareuser_id, barepartnership_id,

  UserIdSet, GroupIdSet,

  I18nText, Language,

  Org, Group, PersonalGroup, Membership, Partnership, PartnershipMembership, Password, User, UserExtras, Role, Roleset, defaultRoleset,

  Vcard, IndividualVcard, GroupVcard, OrgVcard, Name, Email, Phone, Photo, Address, Types,

  DataUrl, EmailUrl, PhoneUrl,

  Persona,
};
