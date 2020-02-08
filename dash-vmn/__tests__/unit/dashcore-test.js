/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../index.js');
let data = require('../../../lib/__tests__/data/contactsdap-test-data.json');
let expect = require('chai').expect;

describe('Stack: Integration\n  ---------------------', function () {

    before(function (done) {
        VMN.Util.reset();
        done();
    });

    describe('Mining & Block Events', function () {

        before(function (done) {
            let da = new VMN.DAPI();
            da.db.cleanDB();
            VMN.DashCore.cleanStack();
            done();
        });

        it('Mine an empty block', function () {
            let dc1 = new VMN.DashCore();
            let b = dc1.mineBlock();
            expect(b).to.exist;
        });

        it('should mine next block on DashCore', function () {
            let dc = new VMN.DashCore();
            let h1 = dc.bestBlockInfo.height;
            dc.mineBlock();
            let h2 = dc.bestBlockInfo.height;
            expect(h1).to.equal(h2 - 1);
        });
        it('sync new blocks on DashCore to DashDrive and DAPI', function () {
            let dc = new VMN.DashCore();
            let dd = new VMN.DashDrive();
            let da = new VMN.DAPI();
            let h1 = dc.bestBlockInfo.height;
            dc.mineBlock();
            expect(da.bestBlockInfo.height === (h1 + 1) && dd.bestBlockInfo.height === (h1 + 1)).to.be.true;
        });
    });

    describe('Creating Blockchain Users', function () {

        before(function (done) {
            let da = new VMN.DAPI();
            da.db.cleanDB();
            VMN.DashCore.cleanStack();
            done();
        });

        let valid = null;

        it('Send raw SubTX via RPC', function () {
            let dc1 = new VMN.DashCore();
            let objJson = JSON.stringify(data.alice_subtx_1);
            valid = dc1.sendrawsubtx(objJson);
            expect(valid).to.not.be.null;
        });

        it('Retrieve SubTX from the mempool', function () {
            let dc1 = new VMN.DashCore();
            let subtx = dc1.db.findInCollection(dc1.mempool.subtx, {
                subtx: {
                    uname: data.alice_subtx_1.subtx.uname
                }
            });
            expect(subtx).to.exist;
        });

        it('Mine SubTX to new block', function () {
            let dc1 = new VMN.DashCore();
            dc1.mineBlock();

            let subtx = dc1.db.findInCollection(dc1.mempool.subtx, {
                subtx: {
                    uname: data.alice_subtx_1.subtx.uname
                }
            });
            expect(subtx).to.not.exist;
        });

        it('SubTX was removed from the mempool', function () {
            let dc1 = new VMN.DashCore();
            let subtx = dc1.db.findInCollection(dc1.mempool.subtx, {
                subtx: {
                    uname: data.alice_subtx_1.subtx.uname
                }
            });
            expect(subtx).to.not.exist;
        });
    });
});
