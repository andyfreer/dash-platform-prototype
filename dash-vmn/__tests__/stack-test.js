/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../index.js');
let data = require('../../lib/__tests__/data/contactsdap-test-data.json');
let expect = require('chai').expect;

describe('Stack: Usecase\n  ---------------------', function () {

    describe('Creating State Transitions', function () {

        let dc = new VMN.DashCore();

        it('send raw transition via JSON RPC', function () {

            let objJson = JSON.stringify(data.alice_stheader_1);
            dc.mineBlock();
            expect(dc.sendrawtransition(objJson)).to.equal(data.alice_stheader_1.stheader.meta.id);
        });
        /*
                it('Retrieve Transition from the mempool', function () {

                    let ts = dc.db.findInCollection(dc.mempool.stheaders, {
                        meta: {
                            id: data.alice_stheader_1.stheader.meta.id
                        }
                    });
                    expect(ts).to.exist;
                });

                it('Mine Transition to new block', function () {

                    dc.mineBlock();

                    let ts = dc.db.findInCollection(dc.mempool.stheaders, {
                        meta: {
                            id: data.alice_stheader_1.stheader.meta.id
                        }
                    });
                    expect(ts).to.exist;
                });

                it('Transition was removed from the mempool', function () {

                    let ts = dc.db.findInCollection(dc.blockchain.stheaders, {
                        meta: {
                            id: data.alice_stheader_1.stheader.meta.id
                        }
                    });
                    expect(ts).to.exist;
                });

                it('Transition was received in DashDrive', function () {

                    // mine an empty block now dd events are wired
                    dc.DashCore.mineBlock();
                    let bu = dc.db.findInCollection(dc.users, {

                        uname: data.alice_subtx_1.data.uname

                    });
                    expect(bu).to.exist;
                });

                it('BU was added to DashDrive', function () {
                    let dd = new VMN.DashDrive();
                    let bu = dd.db.findInCollection(dd.users.subtx, {
                        data: {
                            uname: data.alice_subtx_1.data.uname
                        }
                    });
                    expect(bu).to.exist;
                });
        */
    });
});
