/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../index.js');
let Bitcore = require('@dashevo/dashcore-lib');
let expect = require('chai').expect;
let util = require('../util/test-util.js');
let contactsDapSchema = require('../daps/contactsdap');
let data = {};

// hardcode some private keys so the rest of the test data is deterministic (useful across tests)
let alicePrvKey = 'xprv9uA2C8EwcLUcxdyHSHMzJGfY2fjkL6Tx2bbhcWxJAgWqxzYvmdC7KjfnUUmQbisSrcAwSSZruhdrmNhQZduD87T2xcgZNtid6shsV2tEvEU';
let bobPrvKey = 'xprv9uBFd7Mvs58wqgsWqxuLjBUu7ML3oPiSDAhK3JfxCyzQeGfsNN3uBt4Z9vrT6ZiXZ8WHuSsPRKfLAjgggWmMK3uAwUP4U4YsgBWQNdk15Td';
let charliePrvKey = 'xprv9uc7opTTFYtLxchjijj7uSoaV1xfVSHs9f4dQKkB1UUPTfSD5cHB3cDfZyE6jQLZE5kLGPwmLhfCyZem4bj9oLVNT9uUC1YvAH8JyDC6MPR';

// generate just the data for the other tests that run through basic functions for BUs and creating / using a DAP (DashPay).
// each JSON object is validated from the generation process with a mocha test
// We construct JSON objects manually here but the DAP Client will be developed to automate most of this to make it easier for DAP devs to use
describe('Generate test data\n  ---------------------', function () {

    after(function (done) {

        // write the generated data to a json file
        util.writeTestData(data, 'lib/__tests__/data/', 'contactsdap-test-data');

        done();
    });

    // create subtx to register test users on the blockchain.
    describe('Create Blockchain Users via SubTx', function () {

        function createSubTx(dataPath, uname, prvKey, sig) {

            // create the subtx metadata
            data[dataPath] = {
                subtx: {
                    pver: 1,
                    action: 1, //1=“Register”, 2=“Topup”, 3=“ChangePubKey”, 4=“Deactivate”
                    uname: uname,
                    pubkey: new Bitcore.HDPrivateKey(prvKey).derive("m/0'").publicKey.toString()
                }
            };
            Schema.object.setID(data[dataPath]);

            // ...don't generate new sigs in testdata so we keep a determinstic proceeding dataset
            //sig =  Message(data[dataPath].subtx.meta.id).sign(new Bitcore.HDPrivateKey(prvKey).derive("m/0'").privateKey);
            data[dataPath].subtx.meta.sig = sig;
        }

        it('create valid registration subtx for Alice', function () {

            // sig is ECDSA so we hardcode for test purposes so it doesn't change each time
            let sig = 'INxlyf9JX8j1hfcBNf5W72+UALu7+5nF8l/MfUZSJlomNDkmwWfvva4eE4/tjJPUO+ByV6K3cbUgPhjbEZIM8Ik=';
            createSubTx('alice_subtx_1', 'alice', alicePrvKey, sig);
            let valid = Schema.validate.subtx(data.alice_subtx_1);
            expect(valid.valid).to.be.true;
        });

        it('create valid registration subtx for Bob', function () {

            let sig = 'H3bcSB3TkT/GOC6dFsZ1eS3R3k0RR53DEBcytscUovXbBW2Crys+q4Y1EgbqtttduEnYs8sUcymhLZXh/bk5DBs=';
            createSubTx('bob_subtx_1', 'bob', bobPrvKey, sig);
            expect(Schema.validate.subtx(data.bob_subtx_1).valid).to.be.true;
        });

        it('create valid registration subtx for Charlie', function () {

            let sig = 'HyKamyeif96eePK+Nuvq3K8PIt9V2na9Z0z9yMfQRvgXafk56mKSLswCjPkkyWe+zCh5BtU+rNxHm1Y0FEEpFaE=';
            createSubTx('charlie_subtx_1', 'charlie', charliePrvKey, sig);
            expect(Schema.validate.subtx(data.charlie_subtx_1).valid).to.be.true;
        });

    });

    // Alice creates her own DAP and registers on the blockchain (always data on L2, signed hash of data on L1)
    describe('Create DAP Schema data for Alice to register the DashPay DAP on the blockchain', function () {

        it('create DAPObject containing DashPay DAP Schema, for registraion in the platform DAP', function () {

            // First we need to create a DAP, that provides the interface for blockchainuser clients to store/read some data via DAPI
            // DAP schemas are themselves DAP objects stored in a BU's space in DD.
            // The dapid of DAP schemas are null - this signifies they are DAP schemas and not
            // objects that are members of other DAPs

            // this is the DAP object the Schema is held in (its a container), extends the DapSchema object from the system schema
            data.dashpay_dap = {
                dapcontract: {
                    debug: 'valid registration of a new DAP on the chain', // for debugging
                    pver: 0,
                    idx: 0,
                    dapid: 0,
                    dapname: 'DashPay',
                    dapver: '1',
                    dapschema: contactsDapSchema // here we store the actual schema from above
                }
            };

            //let id = Schema.hash.dapcontract(data.dashpay_dap);
            Schema.object.setID(data.dashpay_dap);

            //let dapcontract = Schema.create.dapcontract();
            let valid = Schema.validate.dapcontract(data.dashpay_dap);
            expect(valid.valid).to.be.true;
        });

        // to store objects from the client in L2, the data goes in a Transition Packet into L2 consensus data (DashDrive) for an MN fee
        // (note fees not implemented here yet)
        it('create Transition Packet containing the DAP Schema Alice is registering', function () {

            //let dapid = Schema.hash.dapschema(data.dashpay_dap);

            data.alice_stpacket_0 = {
                stpacket: {
                    //debug: 'alice_stpacket_0: valid transition packet containing DAP schema reg for DashPay by Alice',
                    pver: 1,
                    dapid: 1,
                    dapname: 'DashPay',
                    dapcontract: data.dashpay_dap.dapcontract
                }
            };
            Schema.object.setID(data.alice_stpacket_0);
            let valid = Schema.validate.stpacket(data.alice_stpacket_0);
            expect(valid.valid).to.be.true;
        });

        // ...and in L1 goes the associated Transition header containing a hash of the packet that's added to a block for a miner fee
        it('create Transition for Alice\'s DashPay DAP Schema registration L1', function () {

            // create an empty transition..
            data.alice_stheader_0 = {
                stheader: {
                    //debug: "valid transition for on-chain reg of Alice's DashPay DAP schema",
                    pver: 1,
                    fee: 0, // blockchainuser fee set for this ts (not implemented yet)
                    uid: '', // blockchainuser id, taken from the tx hash of the blockchainuser"s first subtx
                    ptsid: '', // hash of the previous transition for this blockchainuser (chained)
                    pakid: '', // hash of the associated data packet for this transition
                    usig: '', // sig of the blockchainuser for the pubkey in their last subtx
                    qsig: '', // sig of the dapi quorum that validated the transition data,
                    meta: {}
                }
            };

            // insert hash of the packet associated to this transition
            data.alice_stheader_0.stheader.pakid = data.alice_stpacket_0.stpacket.meta.id;

            // set blockchainuser id (first subtx id)
            data.alice_stheader_0.stheader.uid = data.alice_subtx_1.subtx.meta.id;

            // hash the transition
            Schema.object.setID(data.alice_stheader_0);

            let valid = Schema.validate.stheader(data.alice_stheader_0);

            expect(valid.valid).to.be.true;
        });
    });

    // create the objects, packet and transition required to generate a DAPUser object for Alice on the DashPay DAP she previously registered
    describe('Create Alice\'s data to signup as a DashPay DAP blockchainuser', function () {

        it('create valid DashPay blockchainuser for Alice', function () {

            // To store data in a DAP, each Blockchain User needs to store an object that extends DapUser from the system schema
            // The DAP blockchainuser object is always first in a BU's collection of objects in a given DAP and BUs can only have one DapObject type per DAP space in L2 data
            data.alice_dashpay_user = {
                objtype: 'user',
                debug: 'valid dashpay blockchainuser for alice',
                rev: 1,
                act: 1
            };

            data.alice_dashpay_user.id = Schema.object.composePrimaryKey(
                data.alice_dashpay_user,
                contactsDapSchema,
                data.alice_subtx_1.subtx.meta.id
            );

            // here we have to reference the DAP schema inside Alice's DAPObject in the platform DAP (the DAP of DAPs, aka the 'special' DAP space in L2 where DAPs themselves are defined)
            // ...in the working code we can just refer to the DashPay DAP by the id (hash) generated earlier
            let valid = Schema.validate.dapobject(data.alice_dashpay_user, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition Packet for Alice DAPUser signup on L2', function () {

            data.alice_stpacket_1 = {
                stpacket: {
                    debug: 'alice_stpacket_1: valid transition packet containing Alice\'s DashPay DAPUser signup for L2 storage',
                    pver: 1,
                    dapid: data.dashpay_dap.dapcontract.meta.id, // id (hash) of the DAP space the packet data will be stored in
                    dapobjmerkleroot: Schema.hash.dapobject(data.alice_dashpay_user, data.dashpay_dap.dapcontract.dapschema), // TODO: use actual merkle root
                    dapobjects: [data.alice_dashpay_user]
                }
            };

            Schema.object.setID(data.alice_stpacket_1, data.dashpay_dap.dapcontract.dapschema);
            let valid = Schema.validate.stpacket(data.alice_stpacket_1, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition for Alice DAPUser signup on L1', function () {

            data.alice_stheader_1 = {
                stheader: {
                    //debug: 'valid transition for adding a DashPay signup (DAPUser) object to Alice\'s data in L2',
                    pver: 1,
                    fee: 0, // blockchainuser fee set for this ts (not implemented yet)
                    uid: data.alice_subtx_1.subtx.meta.id, // blockchainuser id, taken from the tx hash of the blockchainuser"s first subtx
                    ptsid: data.alice_stheader_0.stheader.meta.id, // hash of the previous transition for this blockchainuser (chained)
                    pakid: data.alice_stpacket_1.stpacket.meta.id, // hash of the associated data packet for this transition
                    usig: '', // sig of the blockchainuser for the pubkey in their last subtx
                    qsig: '' // sig of the dapi quorum that validated the transition data
                }
            };

            Schema.object.setID(data.alice_stheader_1);

            let valid = Schema.validate.stheader(data.alice_stheader_1);

            expect(valid.valid).to.be.true;
        });
    });

    describe("Create objects and a transition for Alice's contact requests to Bob and Charlie", function () {

        it('create valid Contact object by Alice that references Bob', function () {

            // To store data in a DAP, each Blockchain User needs to store an object that extends DapUser from the system schema
            // The DAP blockchainuser object is always first in a BU's collection of objects in a given DAP and BUs can only have one DapObject type per DAP space in L2 data
            // Note: build issue with ECIES means we're not encrypting payment addresses yet..
            data.alice_contact_1 = {
                objtype: 'contact',
                //debug: 'valid Contact object by Alice referencing Bob',
                pver: 1,
                //dapid: data.dashpay_dap.dapcontract.meta.id,
                rev: 0,
                act: 1,
                toUser: {
                    userId: data.bob_subtx_1.subtx.meta.id
                }, // reference Bob
                hdextpubkey: new Bitcore.HDPrivateKey(alicePrvKey).derive('m/1').hdPublicKey.toString(), // encrypted pay seed to Bob
                agreetscs: 1 // accept the terms and conditions
            };

            data.alice_contact_1.id = Schema.object.composePrimaryKey(
                data.alice_contact_1,
                data.dashpay_dap.dapcontract.dapschema,
                data.alice_subtx_1.subtx.meta.id
            );

            // here we have to reference the DAP schema inside Alice's DAPObject in the platform DAP (the DAP of DAPs, aka the 'special' DAP space in L2 where DAPs themselves are defined)
            // ...in the working code we can just refer to the DashPay DAP by the id (hash) generated earlier
            let valid = Schema.validate.dapobject(data.alice_contact_1, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition Packet for Alice\'s Contact object referencing Bob', function () {

            data.alice_stpacket_2 = {
                stpacket: {
                    //debug: 'valid transition packet containing Alice\'s Contact object referencing Bob',
                    pver: 1,
                    dapid: data.dashpay_dap.dapcontract.meta.id, // id (hash) of the DAP space the packet data will be stored in
                    dapobjmerkleroot: Schema.hash.dapobject(data.alice_contact_1, data.dashpay_dap.dapcontract.dapschema), // TODO: use actual merkle root
                    dapobjects: [data.alice_contact_1],
                    meta: {}
                }
            };
            Schema.object.setID(data.alice_stpacket_2, data.dashpay_dap.dapcontract.dapschema);
            let valid = Schema.validate.stpacket(data.alice_stpacket_2, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition for Alice create contact request', function () {

            data.alice_stheader_2 = {
                stheader: {
                    //debug: 'valid transition for adding a Contact Request in Alice\'s data in L2',
                    pver: 1,
                    fee: 1, // blockchainuser fee set for this ts (not implemented yet)
                    uid: data.alice_subtx_1.subtx.meta.id,
                    ptsid: data.alice_stheader_1.stheader.meta.id, // hash of the previous transition for this blockchainuser (chained)
                    pakid: data.alice_stpacket_2.stpacket.meta.id,
                    usig: '1', // sig of the blockchainuser for the pubkey in their last subtx
                    qsig: '1', // sig of the dapi quorum that validated the transition data
                    meta: {}
                }
            };

            Schema.object.setID(data.alice_stheader_2);

            let valid = Schema.validate.stheader(data.alice_stheader_2);

            expect(valid.valid).to.be.true;
        });
    });

    describe('Create Bob\'s data to signup as a DashPay DAP blockchainuser', function () {

        it('create valid DashPay blockchainuser for Bob', function () {

            // now create data Bob's blockchainuser in the DashPay DAP
            data.bob_dashpay_user = {
                objtype: 'user',
                //debug: 'valid dashpay blockchainuser for bob',
                dapid: data.dashpay_dap.dapcontract.meta.id,
                rev: 0,
                act: 1,
                agreetscs: 1
            };

            data.bob_dashpay_user.id = Schema.object.composePrimaryKey(
                data.bob_dashpay_user,
                data.dashpay_dap.dapcontract.dapschema,
                data.bob_subtx_1.subtx.meta.id
            );

            let valid = Schema.validate.dapobject(data.bob_dashpay_user, data.dashpay_dap.dapcontract.dapschema);
            expect(valid.valid).to.be.true;
        });

        // same process as ts and stpacket #1 for Alice
        it('create Transition Packet for Bob DAPUser signup on L2', function () {

            data.bob_stpacket_0 = {
                stpacket: {
                    //debug: 'valid transition packet containing Bob\'s DashPay DAPUser signup for L2 storage',
                    pver: 1,
                    dapid: data.dashpay_dap.dapcontract.meta.id,
                    dapobjmerkleroot: Schema.hash.dapobject(data.bob_dashpay_user, data.dashpay_dap.dapcontract.dapschema), // TODO: use actual merkle root
                    dapobjects: [data.bob_dashpay_user],
                    meta: {}
                }
            };
            Schema.object.setID(data.bob_stpacket_0, data.dashpay_dap.dapcontract.dapschema);
            let valid = Schema.validate.stpacket(data.bob_stpacket_0, data.dashpay_dap.dapcontract.dapschema);
            expect(valid.valid).to.be.true;
        });

        // transitions hash the packet into a block
        it('create Transition for Bob DAPUser signup on L1', function () {

            data.bob_transition_0 = {
                stheader: {
                    //debug: 'valid transition for adding a DashPay signup (DAPUser) object to Bob\'s data in L2',
                    pver: 1,
                    fee: 0,
                    uid: data.bob_subtx_1.subtx.meta.id,
                    ptsid: '', // hash of the previous transition for this blockchainuser (chained)
                    pakid: data.bob_stpacket_0.stpacket.meta.id,
                    usig: '',
                    qsig: '',
                    meta: {}
                }
            };

            Schema.object.setID(data.bob_transition_0);

            let valid = Schema.validate.stheader(data.bob_transition_0);

            expect(valid.valid).to.be.true;
        });
    });

    describe("Create objects and transition for Bob's contact response to Alice", function () {

        it('create valid Contact object by Bob that references Alice', function () {

            data.bob_contact_1 = {
                objtype: 'contact',
                //debug: 'valid contact object from Bob referencing Alice',
                pver: 1,
                dapid: data.dashpay_dap.dapcontract.meta.id,
                rev: 0,
                act: 1,
                toUser: { // reference Alice
                    userId: data.alice_subtx_1.subtx.meta.id
                },
                hdextpubkey: new Bitcore.HDPrivateKey(bobPrvKey).derive('m/1').hdPublicKey.toString(), // encrypted pay seed to Alice
                agreetscs: 1 // accept the terms and conditions
            };

            data.bob_contact_1.id = Schema.object.composePrimaryKey(
                data.bob_contact_1,
                data.dashpay_dap.dapcontract.dapschema,
                data.bob_subtx_1.subtx.meta.id
            );

            let valid = Schema.validate.dapobject(data.bob_contact_1, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition Packet for Bob DAPUser signup on L2', function () {

            data.bob_stpacket_1 = {
                stpacket: {
                    debug: 'valid transition packet containing Bob\'s Contact response to Alice in his DashPay DAP space',
                    pver: 1,
                    dapid: data.dashpay_dap.dapcontract.meta.id, // id (hash) of the DAP space the packet data will be stored in
                    dapobjmerkleroot: Schema.hash.dapobject(data.bob_contact_1, data.dashpay_dap.dapcontract.dapschema), // TODO: use actual merkle root
                    dapobjects: [data.bob_contact_1]
                }
            };

            Schema.object.setID(data.bob_stpacket_1, data.dashpay_dap.dapcontract.dapschema);
            let valid = Schema.validate.stpacket(data.bob_stpacket_1, data.dashpay_dap.dapcontract.dapschema);

            expect(valid.valid).to.be.true;
        });

        it('create Transition for Bob create contact request', function () {

            data.bob_transition_1 = {
                stheader: {
                    //debug: 'valid transition for adding a Contact Request to Alice in Bob\'s DashPay DAP space',
                    pver: 1,
                    fee: 1, // blockchainuser fee set for this ts (not implemented yet)
                    uid: data.bob_subtx_1.subtx.meta.id,
                    ptsid: data.bob_transition_0.stheader.meta.id, // hash of the previous transition for this blockchainuser (chained)
                    pakid: data.bob_stpacket_1.stpacket.meta.id,
                    usig: '1', // sig of the blockchainuser for the pubkey in their last subtx
                    qsig: '1', // sig of the dapi quorum that validated the transition data
                    meta: {}
                }
            };
            Schema.object.setID(data.bob_transition_1);

            let valid = Schema.validate.stheader(data.bob_transition_1);

            expect(valid.valid).to.be.true;
        });

    });
});

