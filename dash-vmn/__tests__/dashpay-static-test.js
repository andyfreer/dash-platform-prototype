/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../index.js');
let Schema = require('../../lib/index.js');
let data = require('../../lib/__tests__/data/contactsdap-test-data.json');
let expect = require('chai').expect;

let aliceClient = null;
let bobClient = null;

describe('DashPay: DAPI-Client Usecases\n  ---------------------', function () {

    // prepare DAPI clients
    before(function (done) {
        VMN.Util.reset();
        aliceClient = new VMN.Client();
        bobClient = new VMN.Client();

        done();
    });

    describe('Create Blockchain Users', function () {

        it("Register Alice's Blockchain User", function () {

            // Register a username on the chain for Alice, by creating a raw subscription transaction (that we pre-baked in dashpay-gendata.js).
            // If valid it gets added to virtual DashCore's mempool ready to be mined
            // Note in the test stack we haven't implemented L1 tx yet, so we just work with the metadata that forms the subtx right now
            aliceClient.DAPI.CreateUser(data.alice_subtx_1);

            // For testing we need to manually advance the chain to mine the subtx in the virtual DashCore module
            // (in production we can use quroums in various ways to allow use of unconfirmed blockchainuser data but for now we just mine the block)
            aliceClient.DAPI.DashCore.mineBlock();

            // Ask DashCore for the blockchainuser back to confirm via DAPI... the returned Blockchain User is an ephemeral Schema object derived from a list of subtx
            // (in this version we only check the first subtx of a blockchainuser, todo: compile a list of subtx for a BU to determine their subscription status)
            let bu = aliceClient.DAPI.GetUserByName(data.alice_subtx_1.subtx.uname);
            let valid = Schema.validate.blockchainuser(bu);
            expect(valid.valid).to.be.true;
        });

        it("Register Bob's Blockchain User", function () {

            // ...now we register Bob a BU too
            bobClient.DAPI.CreateUser(data.bob_subtx_1);
            bobClient.DAPI.DashCore.mineBlock();
            let bu = bobClient.DAPI.GetUserByName(data.bob_subtx_1.subtx.uname);
            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;
        });

        it("Register Charlie's Blockchain User", function () {

            // ...now we register Charlie a BU too
            bobClient.DAPI.CreateUser(data.charlie_subtx_1);
            bobClient.DAPI.DashCore.mineBlock();
            let bu = bobClient.DAPI.GetUserByName(data.charlie_subtx_1.subtx.uname);
            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;
        });

    });

    describe('Alice creates the DashPay DAP and registers it on the blockchain', function () {
        let tsid = null;
        it("Validate Alice's DAP Schema definition", function () {
            // validate Alice's schema correctly extends the DapSchema def in the system schema
            expect(Schema.compile.dapschema(data.dashpay_dap).valid).to.be.true;
        });

        // Alice's DAP is registered in the 'Platform DAP' on L1/L2
        it("Register Alice's DAP in the Platform DAP", function () {
            tsid = aliceClient.DAPI.UpdateDapSpace(data.alice_stheader_0, data.alice_stpacket_0);
            bobClient.DAPI.DashCore.mineBlock();

            expect(tsid).to.exist;
        });

        it('Find the dap contract in dashdrive', function () {
            let dapContract = aliceClient.DAPI.DashDrive.getDapContract(tsid);
            let valid = Schema.validate.dapcontract(dapContract);
            expect(valid.valid).to.be.true;
        });
    });

    describe('DashPay Friending & Pay-To-Username Process', function () {
        /*
        it("Signup Alice's BU as a DashPayUser within her DashPay DAP space", function () {

            // Submit our pre-baked Packet, containing the DashPay Customer object to DashDrive, and the header Transition containing the packet hash
            // to DashCore for inclusion in a block by a miner.  In production the header needs tobe signed by the DAPI quorum allocated to the calling BU
            let tsid = aliceClient.DAPI.UpdateDapSpace(data.alice_stheader_1, data.alice_stpacket_1);
            aliceClient.DAPI.DashCore.mineBlock();


            // get the state (objects) for Alice stored in her DashPay DAP space in L2, to check that the blockchainuser object above was added
            let userState = aliceClient.DAPI.GetDapSpace(data.dashpay_dap.dapcontract.meta.id, 'alice');

            let dapUserObj = userState.dapstates[0].objects[0];

            // DAPUser objects are always stored in position 0 in a BU's DAP space, lets validate what we stored...
            let valid = Schema.validate.dapobject(dapUserObj, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;

        });

        // Existance of a contact object from one blockchainuser referencing another signifies a request of the counterparty hasn't created an object in their DAP space in response
        it("Alice commits a Contact request (object) for Bob in her DashPay DAP space", function () {

            let tsid = aliceClient.DAPI.UpdateDapSpace(data.alice_stheader_2, data.alice_stpacket_2);
            aliceClient.DAPI.DashCore.mineBlock();

            let objs = aliceClient.DAPI.GetUpdatedUserState('alice', 0);

            let valid = Schema.Consensus.Schema.validate(data.dashpay_dap.data.dapschema.data.DashPayContact, objs[1]);

            expect(valid.valid).to.be.true;
        });

        // Bob detects a related object (with his UID in) from the DashPay DAP, even though he's not signed up to it
        it("Bob's client detects a new Contact request from Alice within the DashPay DAP", function () {

            bobClient.DAPI.DashCore.mineBlock();
            let objs = bobClient.DAPI.GetUpdatedUserState('bob', 0);

            // validate the contact request from Alice
            let valid = Schema.Consensus.Schema.validate(data.dashpay_dap.data.dapschema.data.DashPayContact, objs[0]);

            expect(valid.valid).to.be.true;
        });

        it("Bob decides to signup to the DashPay DAP after detecting Alice\'s contact request there", function () {

            let tsid = bobClient.DAPI.UpdateDapSpace(data.bob_transition_0, data.bob_stpacket_0);
            bobClient.DAPI.DashCore.mineBlock();
            let objs = bobClient.DAPI.GetUpdatedUserState('bob', 0);
            let valid = Schema.Consensus.Schema.validate(data.dashpay_dap.data.dapschema.data.DashPayUser, objs[0]);
            expect(valid.valid).to.be.true;
        });

        // 2 contact objects (one existing for Alice & Bob) are needed to form a relationship (exchange of hdextpubkeys for deriving unlimited pay addresses)
        it("Bob creates a Contact object for Alice\'s to confirm her request", function () {

            let tsid = bobClient.DAPI.UpdateDapSpace(data.bob_transition_1, data.bob_stpacket_1);
            bobClient.DAPI.DashCore.mineBlock();
            let objs = bobClient.DAPI.GetDapSpace(data.dashpay_dap.meta.id, 'bob');
            let valid = Schema.Consensus.Schema.validate(data.dashpay_dap.data.dapschema.data.DashPayContact, objs[1]);
            expect(valid.valid).to.be.true;
        });


        it("Alice\'s client detects the contact acceptance from Bob", function () {
            bobClient.DAPI.DashCore.mineBlock();
            let objs = bobClient.DAPI.GetUpdatedUserState('alice', 0);

            // validate the contact response from Bob
            let valid = Schema.Consensus.Schema.validate(data.dashpay_dap.data.dapschema.data.DashPayContact, objs[2]);

            expect(valid.valid).to.be.true;
        });

        // Alice's client derives payment addresses to Bob using the pubkey he encrypted for her in his Contact object in his DashPay DAP space
        it("Alice\'s client generates payment addresses for Bob", function () {

            let payPubKey = Bitcore.HDPublicKey.fromString(data.bob_contact_1.data.hdextpubkey);
            let genCount = 5;
            let validAddrCount = 0;
            for (let i = 0; i < genCount; i++) {
                let derivedAddressForBob = new Bitcore.Address(payPubKey.derive(i).publicKey, Bitcore.Networks.testnet).toString();
                if (Bitcore.Address.fromString(derivedAddressForBob)) {
                    validAddrCount++;
                }
            }
            expect(validAddrCount).to.equal(genCount);
        });

        it("Bob\'s client generates payment addresses for Alice", function () {

            let payPubKey = Bitcore.HDPublicKey.fromString(data.alice_contact_1.data.hdextpubkey);
            let genCount = 5;
            let validAddrCount = 0;
            for (let i = 0; i < genCount; i++) {
                let derivedAddressForBob = new Bitcore.Address(payPubKey.derive(i).publicKey, Bitcore.Networks.testnet).toString();
                if (Bitcore.Address.fromString(derivedAddressForBob)) {
                    validAddrCount++;
                }
            }
            expect(validAddrCount).to.equal(genCount);
        });
*/
    });
});
