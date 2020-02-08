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

describe('HelloWorld Client Test Sequence\n  ---------------------', function () {

    let HelloWorldClient = null;

    before(function (done) {
        VMN.Util.reset();
        done();
    });

    describe('HelloWorld: adding objects', function () {

        it('Init HelloWorld Client', async function () {

            HelloWorldClient = new VMN.HelloWorldClient({numTestUsers: 0});
            await HelloWorldClient.genTestData();
        });

        it('Register users onchain', async function () {

            // create & send subtx for each blockchainuser
            for (let i = 0; i < 3; i++) {
                await HelloWorldClient.createBlockchainUser(HelloWorldClient.testHelper.testUsers[i][0], HelloWorldClient.testHelper.testUsers[i][1]);
            }

            let bu = await HelloWorldClient.DAPI.GetUserByName(HelloWorldClient.testHelper.testUsers[0][0]);
            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;

        });

        it('Login to Client', async function () {

            await HelloWorldClient.login(
                HelloWorldClient.testHelper.testUsers[0][0],
                HelloWorldClient.testHelper.testUsers[0][1]
            );

            expect(HelloWorldClient._isAuthed).to.be.true;
        });
    });
});
