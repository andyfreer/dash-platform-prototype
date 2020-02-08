/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../lib/index.js');
let VMN = require('../../dash-vmn/index.js');
let expect = require('chai').expect;
let Daps = require('../index.js');

/*
var mocha = require('mocha');
var describe = require('mocha').describe;
var it = mocha.it;
var before = mocha.before;
*/

describe('DashPay Client Test Sequence\n  ---------------------', function () {

    let DashPayLib = null;
    let dapid = null;

    before(function (done) {
        VMN.Util.reset();
        done();
    });

    describe('DashPay: adding objects', function () {

        it('Init DashPayLib', async function () {

            DashPayLib = new VMN.DashPayLib({numTestUsers: 0});
            await DashPayLib.genTestData();
        });

        it('Register users onchain', async function () {

            // create & send subtx for each blockchainuser
            for (let i = 0; i < 3; i++) {
                await DashPayLib.createBlockchainUser(DashPayLib.testHelper.testUsers[i][0], DashPayLib.testHelper.testUsers[i][1]);
            }
            let bu = await DashPayLib.DAPI.GetUserByName(DashPayLib.testHelper.testUsers[0][0]);
            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;

        });

        it('Login to Client', async function () {

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );
            expect(DashPayLib._isAuthed).to.be.true;
        });

        it('Create DashPay DAP', async function () {

            dapid = await DashPayLib.createDap(Daps.DashPay);
            let dapContract = await DashPayLib.getDap(dapid);
            DashPayLib.setDap(dapContract);

            expect(dapid).to.exist;
        });

        it('Alice signup to the DashPay DAP', async function () {

            let obj = Schema.create.dapobject('user');
            obj.aboutme = 'a';
            obj.avatar = 'b';

            // Signup to the DashPay DAP space
            await DashPayLib._signup(obj);
            let signupObj = DashPayLib.dapContext.objects[0];
            expect(signupObj && (DashPayLib.dapContext.objects.length === 1)).to.be.true;
        });

        it('Prevent Alice propose contact to her self', async function () {

            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[0][0]);
            expect(o).to.not.exist;
        });

        it('Alice propose contact to Bob', async function () {

            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[1][0]);
            expect(o).to.exist;
        });

        it('Alice propose contact to Charlie', async function () {

            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[2][0]);
            expect(o).to.exist;
        });

        it('Prevent Alice proposing duplicate contact to Charlie', async function () {

            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[2][0]);
            expect(o).to.not.exist;
        });

        it('Login to client as Bob', async function () {

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[1][0],
                DashPayLib.testHelper.testUsers[1][1]
            );

            expect(DashPayLib._isAuthed).to.be.true;
        });

        it("Check Bob's state", function () {

            let state = DashPayLib.dapContext;

            expect(state).to.exist;
        });

        it('Bob propose contact to Charlie', async function () {

            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[2][0]);

            expect(o).to.exist;
        });

        it('Valid DashPay contacts list derivation', function () {

            // context should contain received invite from Alice sent request to Charlie
            let contacts = DashPayLib._contactList;

            expect(contacts).to.exist;
        });

    });

    describe('DashPay: updating objects', function () {

        before(function (done) {
            VMN.Util.reset();
            done();
        });

        it('First, instantiate lib', async function () {

            // this will create a bunch of test data
            DashPayLib = new VMN.DashPayLib({numTestUsers: 3});
            await DashPayLib.genTestData();

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );
            expect(DashPayLib._isAuthed).to.be.true;

        });

        it('Alice propose contact to Bob', async function () {

            await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[1][0]);
            expect(DashPayLib.dapContext.objects[1]).to.exist;
        });

        it('Alice removes contact proposal to Bob', async function () {

            await DashPayLib.removeContact(DashPayLib.testHelper.testUsers[1][0]);
            expect(DashPayLib.dapContext.objects[0]).to.exist;
        });

    });

    describe('DashPay: TestHelper data', function () {

        before(function (done) {
            VMN.Util.reset();
            done();
        });

        it('First, instantiate lib', async function () {

            // this will create a bunch of test data
            DashPayLib = new VMN.DashPayLib({numTestUsers: 3});
            await DashPayLib.genTestData();

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );
            expect(DashPayLib._isAuthed).to.be.true;

        });


        it('Get Alice BU', async function () {

            let bu = await DashPayLib.getUser(DashPayLib.testHelper.testUsers[0][0]);
            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;
        });

        it('Get the DashPay DAP from DAPI', async function () {

            let daps = await DashPayLib.searchDaps('DashPay');
            let dap = await DashPayLib.getDap(daps[0].dapcontract.meta.dapid);
            let valid = Schema.validate.dapcontract(dap);
            expect(valid.valid).to.be.true;
        });


        it('valid downloaded BU from login', function () {

            let valid = Schema.validate.blockchainuser(DashPayLib._currentUser);
            expect(valid.valid).to.be.true;
        });

        it('Search user', async function () {

            let bu = await DashPayLib.searchUsers(DashPayLib.testHelper.testUsers[0][0].substring(0, 3));
            let valid = Schema.validate.blockchainuser(bu[0]);
            expect(valid.valid).to.be.true;
        });
    });

    describe('DashPayLib: View-State Derivation', function () {

        before(function (done) {
            VMN.Util.reset();
            done();
        });

        it('Init DashPayLib and login as Alice', async function () {

            DashPayLib = new VMN.DashPayLib({numTestUsers: 3});
            await DashPayLib.genTestData();

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );

            expect(DashPayLib._isAuthed).to.be.true;
        });
        it('Alice propose contact to Bob', async function () {
            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[1][0]);
            expect(o).to.exist;
        });

        it('Valid dapcontext with proposal to bob', async function () {
            let contactUid = DashPayLib.dapContext.objects[1].toUser.userId;
            let bob = await DashPayLib.getUser(DashPayLib.testHelper.testUsers[1][0]);
            let bobUid = bob.blockchainuser.uid;
            expect(contactUid === bobUid).to.be.true;
        });

        it('Valid DashPay view derivation with proposed contact to Bob', function () {

            // context should contain single proposed contact to Bob
            let contact = DashPayLib._contactList[0];

            expect(contact.type === 'proposed').to.be.true;
        });

        it('Login to client as Bob & get state', async function () {

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[1][0],
                DashPayLib.testHelper.testUsers[1][1]
            );
            let state = DashPayLib.dapContext;
            expect(state).to.exist;
        });

        it("Check Bob's dapcontext with related proposal from Alice", async function () {

            let relatedUid = DashPayLib.dapContext.related[0].toUser.userId;
            let bob = await DashPayLib.getUser(DashPayLib.testHelper.testUsers[1][0]);
            let bobUid = bob.blockchainuser.uid;
            expect(relatedUid === bobUid).to.be.true;
        });

        it('Valid DashPay view derivation with proposed contact from Alice', function () {

            // context should contain single proposed contact to Bob
            let contact = DashPayLib._contactList[0];
            expect(contact.type === 'requested').to.be.true;
        });

        it('Bob propose contact to Alice', async function () {
            let o = await DashPayLib.proposeContact(DashPayLib.testHelper.testUsers[0][0]);
            expect(o).to.exist;
        });

        it('Valid dapcontext with proposal to and from bob', async function () {

            let contactUid = DashPayLib.dapContext.objects[1].toUser.userId;
            let alice = await DashPayLib.getUser(DashPayLib.testHelper.testUsers[0][0]);
            let bob = await DashPayLib.getUser(DashPayLib.testHelper.testUsers[1][0]);
            let aliceUid = alice.blockchainuser.uid;
            let bobUid = bob.blockchainuser.uid;
            let relatedUid = DashPayLib.dapContext.related[0].toUser.userId;
            expect((contactUid === aliceUid) && (relatedUid === bobUid)).to.be.true;
        });

        it('Valid DashPay view derivation with approved contact with Bob', function () {

            // context should contain single approved contact to Bob
            let contact = DashPayLib._contactList[0];
            expect(contact.type === 'approved').to.be.true;
        });

        it('Login to client as Alice & get state', async function () {

            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );
            let state = DashPayLib.dapContext;
            expect(state).to.exist;
        });
    });

    describe('Duplicate data', function () {

        before(function (done) {
            VMN.Util.reset();
            done();
        });

        it('Init DashPayLib and login as Alice', async function () {

            DashPayLib = new VMN.DashPayLib({numTestUsers: 2});
            await DashPayLib.genTestData();
            await DashPayLib.login(
                DashPayLib.testHelper.testUsers[0][0],
                DashPayLib.testHelper.testUsers[0][1]
            );
            expect(DashPayLib._isAuthed).to.be.true;
        });

        it('Prevent Alice creating duplicate DAP Signup object', async function () {

            let obj = Schema.create.dapobject('user');
            obj.aboutme = 'a';
            obj.avatar = 'b';

            // Signup to the DashPay DAP space
            await DashPayLib._signup(obj);
            let signupObj = DashPayLib.dapContext.objects[0];
            expect(signupObj && (DashPayLib.dapContext.objects.length === 1)).to.be.true;
        });
    });
});
