
This is a guide for the [dash-schema Github Repository](http://github.com/dashevo/dash-schema)

# Dash-Schema

In Dash, like most cryptocurrencies, the code is the protocol, and that code is mainly in a single reference implementation used for the Core P2P client, which makes it harder to create alternative implementations and increases technical debt.

As Dash Evolution is User Account based, it's heavily data-focused, in that a large amount of **user data**  are being passed between multiple components such as HTTPS Clients and the Decentralized API, being stored in DashDrive, and hashed on the blockchain in the DashCore P2P client, a better approach is needed to ensure consistency of handling and validation of the data involved across multiple components in the sysetm.

The Dash Schema is the solution to this problem as it provides a common protocol specification for the Evolution data structures in JSON that can then be interpreted programmatically by any component within the Dash infrastructure or end-user application for all Evolution data.

As in the pre-Evo Layer 1 of Dash, we can consider the major object types to be Blocks, Transactions, Inputs & Outputs, Scripts, Addresses etc, in Evo Layer 2 we identify the major [object types]() and then create a JSON Schema definition for each that can fully describe the format, syntax and validity of an object, as well as the consensus rules needed to verify it according to the consensus rules.

Consequently, each L2 data object in the Evolution consensus protocol is actually an instance of a JSON schema definition and can be programmatically validated against it's relevant JSON Schema definition.

This means that whether a piece of data is a Contact on a client or a Transition on the blockchain, a single set of programmatically-interpretable rules and consensus validation code can be used to ensure a specific implementation is interoperating correctly within the consensus protocol.

Schemas provide a way to specify the exact rules for the syntax, format and validation of each data structure added to Dash V13, Evolution and provide the implementation code (initially JavaScript) to create and validate those data structures, within a single repository.

By referencing this library, Evolution components such as Clients, DAPI and DashDrive can ensure that the user-data they are creating, processing and storing is valid to the same consensus rules and using a single reference implementation.

# Contents
**JSON Schemas for Evolution objects.**

Authoritative, shared JSON Schema definitions of all new object types in the Evolution L2 protocol, including protocol-defined schemas and user-defined schemas (Daps such as DashPay).

For direct use in any implementation of any Dash related software to provide a programmatic determination of the validity of any Evolution data in accordance to the consensus rules.

**Consensus code**

Shared ES6 code implementing consensus rules that determine the valid specification, application and interpretation of JSON Schema definitions and their data instances.

For use in L2 components such as DashDrive, DAPI and clients.

**JS Implementation models for all JSON Schemas**

Per-schema ES6 object models for use as helpers for instantiating, transporting and validating objects & their data instances using the included JSON Schema definitions and consensus code.

For use in L2 components such as DashDrive, DAPI and clients.

**Virtual Masternode Test-Stack**
 
Simulated Evolution environment for testing usecases across virtual V13 Masternode components.

For testing the DAPs using the Schema rules, models and data validation with the shared consensus code

# Schema Types

Schema objects can be stored on either Layer 1 (DashDrive that provides the blockchain consensus data) or Layer 2 (DashDrive / DAPI which provide the L2 consensus data) 

There are two types of Schema objects

 - System Objects, that represent fixed structures within the protocol
 - DAP objects, which 3rd party developers can extend into their own DAP Schemas.

Users need to access DAPI via a DAP that either they create or that a 3rd party developer has already created and registered on the chain.

## System Objects

| Object Type | Extends | Storage  | Description |
 ---------- | ---------- | ---------- | ----------
| ObjectBase | none | abstract | Required base class for all schema objects |
| SysObject | ObjectBase | abstract | Required base class for all system objects |
| Sub Tx | SysObject | L1 | The JSON metadata stored in subtx no-op data |
| User | SysObject | ephemeral | Ephemeral object representing a Blockchain User, derived from subscription transactions for a blockchain username | 
| State Transition | inherits | L1 | Represents the change in state of a Blockchain User and is added to a block by a miner for a fee (converted from credits via the coinbase) |
| Transition Packet | inherits | dashdrive | The associated change to the BU's data for a given State Transition.  Contains a merkle tree of object additions, updates and removals to a BU's L2 dataset |
| DAPObject | ObjectBase | abstract | Required base class for all DAP objects |
| DAPSchema | ObjectBase | L2 | Contains a DAP schema created by a 3rd party developer in L2 with the hash in a transition in L1 |

## DAP Objects

| Object Type | Inherits | Storage  | Description |
 ---------- | ---------- | ---------- | ----------
| DAP User | DAPObject | L2 | Instance of a Blockchain User for a given DAP |
| DAP Budget Proposal       | DAPObject | L2 | A type of DAP Data object used to signal a budget proposal to L2 Admin Quorums |
| DAP Budget Vote | DAPObject | L2  | A type of DAP Data object used to signal a vote on a given budget proposal to L2 Admin Quorums |
| DAP BU Rating | DAPObject | L2  | A type of DAP Data object used to signal a change to the aggregate rating of a BU to another BU  |
| DAP BU Report | DAPObject | L2  | A type of DAP Data object used to signal a problem report from one BU to another |

The full system schema can be viewed at:

```
./lib/__schemas__/dash-system-v13-0.json
```

# Test-Stack

The test-stack is a simulated Evolution stack for testing Schema object usecases on a virtual end-to-end system processed using the actual consensus code that the production implementations will use.

The stack enables integrated testing of usecase data and is a good tool to help developers to learn how the Evolution stack operates as a whole.

Each component in the stack has an interface accessible to every other component and also imitate the internal processing, validation and storage of Schema objects in the production implementations, enabling Evo Schemas and consensus code to be tested in various ways.

For example, the DashCore mock component implements the same RPC & ZeroMQ interface for Evo functions as the production implementation and also validates and stores objects such as User accounts and Transitions in a virtual in-memory blockchain.  The DAPI and DashDrive mock components can then send and receive Evo objects to DashCore mocks.

Components in the stack (DashPayLib, SDK, DAPI, DashDrive & DashCore) are interconnected using the actual interface calls and internal Evo object processing, validation and persistance using the Schema consensus rules, to allow thorough testing of different use cases such as signup, friending and ecommerce functions.
 and the local storage (in DashDrive and DashCore) of Schema objects.




