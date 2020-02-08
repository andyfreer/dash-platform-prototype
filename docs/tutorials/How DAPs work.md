
DAPs are essentially interfaces that 3rd party developers can create to make it easier to tightly integrate their apps with the Dash blockchain and userbase via a decentralized HTTP API hosted by the Masternode P2P network.

Lets walk through the basics...note you can see this data generated in:
 ```
 ./__tests__/data/gen/test-gendata.js
```

First we create Blockchain Users on L1 that are unique usernames Dash users can register on the chain and use to prove their identity by signing for the pubkey specified in their on-chain subscription transaction.  They also burn an amount of Dash that's converted 1:1 into virtual 'credits'.  These will be spent back to MNs and miners for updating the BUs data in L2 and explained later.

```
    // create the subtx metadata
    let subtx = {
        description: "valid - registration subtx meta for " + uname,
        data: {
            pver: 1,
            objtype: "SubTx",
            action: 1,          //1=“Register”, 2=“Topup”, 3=“ChangePubKey”, 4=“Deactivate”
            uname: uname,
            pubkey: 'pubkeygere'
        },
        meta: {}
    };
```

Now lets take a company (we'll call the Developer) in the ecosystem who wants to integrate Dash.  They might be an exchange, a fiat converter, or even a developer making a mobile payments app or wishing to monetize their website or content within their website such as pay-to-view or rewarding user generated content.

Each of those developers have existing requirements for how they want to integrate payments with Dash users.  For example a merchant will have their own database with e.g. customers, products and orders, they they will manually need to integrate to the Dash transactions to know who paid who and when.

DAPs are essentially an interface that the developer creates and register on chain, defined as a Dash-extended JSON Schema (draft 6)

For example:

```
    let dapSchema = {
        "data": {
            "title": "DashPay",
            "DashPayUser": {
                "title": "DashPayUser",
                "type": "object",
                "extends": "DapUser",
                "properties": {
                    "imgurl": {
                        "type": "string"
                    }
                }
            },
            "UserContact": {
                "title": "UserContact",
                "type": "object",
                "required": [
                    "cname"
                ],
                "properties": {
                    "cname": {
                        "type": "string"
                    },
                    "blob": {
                        "type": "string"
                    }
                }
            }
        }
    };
```            

By defining the above (basic) structure, the Developer can provide an interface to their real-world application directly to Dash users, who can store data within the Developers required data model.

This enables the developer to offload relational-data and processing the Dash blockchain, and tightly integrate with the existing Dash Blockchain-User base.

(in progress..)