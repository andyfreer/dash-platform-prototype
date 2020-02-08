/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../lib/index.js');
let VMN = require('../../index.js');
let expect = require('chai').expect;

describe('Browser: DashPay / Client Usecases\n  ---------------------', function () {

    let Client = null;

    let testDapSchema = {
        '$id': 'http://dash.org/schemas/sys/dapschema',
        'title': 'TestDap',
        'profile': {
            'type': 'object',
            'allOf': [{'$ref': 'http://dash.org/schemas/sys#/definitions/dapobjectbase'}],
            'properties': {
                'bio': {
                    'type': 'string'
                }
            }
        },
        'someobject': {
            'type': 'object',
            'allOf': [{'$ref': 'http://dash.org/schemas/sys#/definitions/dapobjectbase'}],
            'properties': {
                'helloworld': {
                    'type': 'string'
                }
            }
        }
    };

    before(function (done) {
        VMN.Util.reset();
        done();
    });

    describe('Create a basic test DAP', function () {

        before(function (done) {
            VMN.Util.reset();
            done();
        });

        it('First, instantiate lib', async function () {
            // just create genesis block (no test users yet)
            Client = new VMN.DashPayLib({numTestUsers: 0});
            // So we can continue only after test data is created
            await Client.genTestData();

            expect(Client._isAuthed).to.be.false;
        });

        it("Create Alice's Blockchain User", async function () {

            let uname = Client.testHelper.testUsers[0][0];
            let prvkey = Client.testHelper.testUsers[0][1];
            await Client.createBlockchainUser(uname, prvkey);
            let bu = await Client.getUser(uname);

            expect(Schema.validate.blockchainuser(bu).valid).to.be.true;
        });

        it('Login to Client', async function () {

            await Client.login(
                Client.testHelper.testUsers[0][0],
                Client.testHelper.testUsers[0][1]
            );

            expect(Client._isAuthed).to.be.true;
        });

        it("Create a test DAP using Alice's bu", async function () {

            let dapSchema = testDapSchema;

            let dapid = await Client.createDap(dapSchema);

            let dap = await Client.getDap(dapid);

            Client.setDap(dap);

            let valid = Client.checkDap();

            expect(valid).to.be.true;
        });
    });

    describe('DAP Object add, update, remove sequence', function () {

        it("Create the first object in Alice's test DAP state", async function () {

            let o = Schema.create.dapobject('someobject');
            o.helloworld = 'I am object #1!';

            await Client.addObject(o);

            expect(Client.dapContext.objects[0].helloworld).to.be.equal(o.helloworld);
            expect(Client.dapContext.objects[0]).to.have.property('id');
        });

        it('Invalidate insert of object with id which already present', async function () {
            let o = Schema.create.dapobject('someobject');
            o.id = Client.dapContext.objects[0].id;
            o.act = 1;
            o.helloworld = 'I am object #2!';

            await Client.commitSingleObject(o);

            expect(Client.dapContext.objects).to.be.lengthOf(1);
        });

        it('Invalidate update of object with ID which is not present', async function () {

            let o = Schema.create.dapobject('someobject');
            o.id = 'unknown';
            o.act = 2;
            o.helloworld = 'I am object #3!';

            await Client.commitSingleObject(o);

            expect(Client.dapContext.objects).to.have.lengthOf(1);
        });

        it('Invalidate delete of object with ID which is not present', async function () {

            let o = Schema.create.dapobject('someobject');
            o.id = 'unknown';
            o.act = 3;
            o.helloworld = 'I am object #3!';

            await Client.commitSingleObject(o);

            expect(Client.dapContext.objects).to.have.lengthOf(1);
        });

        it('Valid insert of second object (manual id)', async function () {

            let o = Schema.create.dapobject('someobject');
            o.id = 'test';
            o.act = 1;
            o.helloworld = 'I am object #4!';

            await Client.commitSingleObject(o);

            expect(Client.dapContext.objects[1].id).to.be.equal(o.id);
        });

        it('Valid update of first object', async function () {

            let o = Client.dapContext.objects[0];
            o.helloworld += ' revision 2!';
            Client.updateObject(o);

            expect(Client.dapContext.objects[0].helloworld).to.be.equal(o.helloworld);
        });

        it('Valid removal of first object', async function () {

            let o = Client.dapContext.objects[0];
            await Client.removeObject(o);

            expect(Client.dapContext.objects).to.have.lengthOf(1);
        });
    });
});
