## ADDED Requirements (Additions to Broker Client Workflow)

> **Screen References**: Key screens for these additions:
> - S8. Broker Client Onboarding Workspace - Broker sets filter constraints during onboarding
> - S9. Client Detail Page - Client modifies filter values within constraints
> - S10. Admin Brokers Management - Admin switches clients between brokers
>
> See [`../design.md`](../design.md#screen-and-component-manifest) for complete screen and component specifications.

### Requirement: Client-Broker Assignment Management

The system SHALL ensure every client has exactly one broker assignment at all times, with the default FAIRLEND broker serving as the fallback. Admins can switch clients between brokers, and brokers can revoke clients (reassigning to FAIRLEND). Clients without a broker cannot operate on the platform.

#### Scenario: New user defaults to FAIRLEND broker

- **GIVEN** a new user signing up via WorkOS
- **WHEN** their user record is created
- **THEN** the system automatically assigns them to the default FAIRLEND broker in the `broker_clients` table with `onboardingStatus: "invited"`

#### Scenario: Admin switches client broker

- **GIVEN** a platform admin viewing a client's record assigned to broker A
- **WHEN** they switch the client to broker B
- **THEN** the system updates `broker_clients.brokerId` to broker B, logs the change in an audit trail, and notifies both old and new brokers

#### Scenario: Broker revokes client

- **GIVEN** a broker viewing a client in their client list
- **WHEN** they click "Revoke Client"
- **THEN** the system updates `broker_clients.brokerId` to the FAIRLEND broker, logs the revocation in an audit trail, notifies the client and admin, and the client can no longer access the broker's portal

#### Scenario: Client cannot be without a broker

- **GIVEN** any client record in the system
- **WHEN** querying the client's broker assignment
- **THEN** the system always returns a valid `brokerId` (never null), with FAIRLEND broker as the absolute fallback

#### Scenario: Middleware verifies client broker assignment

- **GIVEN** a client attempting to access any client-facing page
- **WHEN** the request is processed
- **THEN** the middleware verifies the client has a valid broker assignment and redirects to an error page if not

#### Scenario: Broker deletion reassigns all clients

- **GIVEN** a broker account being deleted by admin
- **WHEN** the deletion executes
- **THEN** the system reassigns all clients associated with that broker to the FAIRLEND broker

---

### Requirement: Default FAIRLEND Broker

The system SHALL include a pre-configured FAIRLEND broker record that serves as the default broker for all new users and the fallback when clients are revoked from other brokers.

#### Scenario: FAIRLEND broker is pre-provisioned

- **GIVEN** a fresh system deployment
- **WHEN** the system initializes
- **THEN** the system creates a broker record with subdomain "fairlend" and special flag indicating it's the default broker

#### Scenario: FAIRLEND broker has no client filters

- **GIVEN** the FAIRLEND broker record
- **WHEN** viewing its configuration
- **THEN** it has no filter constraints, allowing clients unlimited access to all listings (suitability handled separately)

#### Scenario: FAIRLEND broker has minimal commission rate

- **GIVEN** the FAIRLEND broker record
- **WHEN** viewing its commission configuration
- **THEN** it has the minimal commission rate (e.g., 0%) and return adjustment rate (e.g., 0%) set by the platform

---

### Requirement: Client Filter Value Modification Within Constraints

The system SHALL allow clients to modify their selected filter values within the constraints set by their broker, with validation ensuring no constraint is violated.

#### Scenario: Client modifies filter values within constraints

- **GIVEN** a client with broker constraints minLTV: 50, maxLTV: 70
- **WHEN** they modify their selected values to minLTV: 55, maxLTV: 65
- **THEN** the system validates the values against constraints and saves the modification

#### Scenario: Client modification fails outside constraints

- **GIVEN** a client with broker constraints maxLTV: 70
- **WHEN** they attempt to set their selected value to maxLTV: 75
- **THEN** the system displays a validation error and prevents the save

#### Scenario: Client sees constraint indicators

- **GIVEN** a client viewing their filter configuration form
- **WHEN** the form renders
- **THEN** the system displays the broker's constraints as read-only indicators or tooltips (e.g., "Max LTV: 70%")

#### Scenario: Client modifies property type selection

- **GIVEN** a broker with allowed property types: ["residential", "commercial", "mixed"]
- **WHEN** a client selects "residential" and "commercial"
- **THEN** the system validates the selection against the allowed list and saves the client's choice

#### Scenario: Client cannot select disallowed property type

- **GIVEN** a broker with allowed property types: ["residential", "commercial"]
- **WHEN** a client attempts to select "industrial"
- **THEN** the system displays a validation error and does not include the disallowed type

#### Scenario: Client saves filter changes apply immediately

- **GIVEN** a client modifying their selected filter values
- **WHEN** they save the changes
- **THEN** the system updates `broker_clients.filters.values` and immediately applies the new values to listing queries

---

### Requirement: Admin Override of Filter Constraints

The system SHALL allow platform admins to modify filter constraints beyond what the broker configured, with all override actions logged in an audit trail.

#### Scenario: Admin modifies broker filter constraints

- **GIVEN** a platform admin viewing a client's filter configuration
- **WHEN** they set maxLTV constraint to 80% (higher than the broker originally set)
- **THEN** the system updates the constraint and logs the override action with admin ID, timestamp, and reason

#### Scenario: Admin override bypasses validation

- **GIVEN** an admin modifying filter constraints
- **WHEN** they save the modification
- **THEN** the system bypasses broker business rule validation and applies the override

#### Scenario: Admin override generates audit trail

- **GIVEN** an admin modifying filter constraints
- **WHEN** the change is saved
- **THEN** the system creates an audit record including:
  - Admin user ID
  - Client ID
  - Previous constraint values
  - New constraint values
  - Timestamp
  - Optional reason

#### Scenario: Broker notified of admin override

- **GIVEN** a broker whose client's filters have been overridden by admin
- **WHEN** the override completes
- **THEN** the system sends the broker a notification indicating an admin has modified filter constraints for one of their clients