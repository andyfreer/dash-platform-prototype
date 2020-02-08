/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../index.js');
let expect = require('chai').expect;

describe('Stack: Unit\n  ---------------------', function () {

    describe('DAPI Unit', function () {

        let dapi = null;

        before(function (done) {
            VMN.Util.reset();
            dapi = new VMN.DAPI();
            done();
        });
        /*
        it('create BU subscription via DAPI', function () {
            dapi.CreateUser(data.alice_subtx_1);
            dapi.DashCore.mineBlock();
            let bu = dapi.DashCore.getuserbyname(data.alice_subtx_1.data.uname);
            expect(Schema.Consensus.User.validateUser(bu).valid).to.be.true;
        });

        it('should return an existing blockchain-user by name', function () {
            let bu = dapi.GetUserByName('alice');
            expect(Schema.Consensus.User.validateUser(bu).valid).to.be.true;
        });
        */
        it('return null for non-existing blockchain username', function () {
            let bu = dapi.GetUserByName('alice2');
            expect(bu).to.not.exist;
        });
    });
    /*
   describe('DashDrive Unit', function () {

       let drive = null;

       before(function (done) {
           VMN.Util.reset();
           drive = new VMN.DashDrive();
           don;
       });
       /*
       it('should pin a transition packet in DashDrive', function () {
           let pakid = drive.pinPacket(data.alice_stpacket_1);
           expect(pakid).to.exist;
       });


   });
   */
});
