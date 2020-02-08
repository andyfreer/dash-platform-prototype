/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../index.js');
let expect = require('chai').expect;

describe('Stack: Integration\n  ---------------------', function () {

    before(function (done) {
        VMN.Util.reset();
        done();
    });

    describe('Instancing Patterns', function () {

        it('destroy singleton (Node) module via cleanStack()', function () {

            let dc1 = new VMN.DashCore();
            dc1.bestBlockInfo.height = 111;
            let h1 = dc1.bestBlockInfo.height;

            // now delete the stack
            VMN.DashCore.cleanStack();

            dc1 = new VMN.DashCore();
            let h2 = dc1.bestBlockInfo.height;
            expect(h2).to.not.equal(h1);
        });

        it('destroy multi-instance (Client) via constructor', function () {

            let da1 = new VMN.Client();
            da1.bestBlockInfo.height = 222;

            let da2 = new VMN.Client();
            da2.bestBlockInfo.height = 333;

            expect(da1.bestBlockInfo.height).to.not.equal(da2.bestBlockInfo.height);
        });

        it('should be singleton instance of DashCore', function () {
            let dc1 = new VMN.DashCore();
            let dc2 = new VMN.DashCore();
            dc1.bestBlockInfo.height = 101;
            expect(dc1.bestBlockInfo.height).to.equal(dc2.bestBlockInfo.height);
        });

        it('should be singleton instance of DashDrive', function () {
            let dd1 = new VMN.DashDrive();
            let dd2 = new VMN.DashDrive();
            dd1.bestBlockInfo.height = 102;
            expect(dd1.bestBlockInfo.height).to.equal(dd2.bestBlockInfo.height);
        });

        it('should be singleton instance of DAPI', function () {
            let da1 = new VMN.DAPI();
            let da2 = new VMN.DAPI();
            da1.bestBlockInfo.height = 103;
            expect(da1.bestBlockInfo.height).to.equal(da2.bestBlockInfo.height);
        });

        it('should allow multiple instance of DapSDK', function () {
            let sd1 = new VMN.Client();
            let sd2 = new VMN.Client();
            sd1.bestBlockInfo.height = 104;
            expect(sd1.bestBlockInfo.height).to.not.equal(sd2.bestBlockInfo.height);
        });

        it('should allow multiple instance of DashPay Lib', function () {
            let dp1 = new VMN.DashPayLib();
            let dp2 = new VMN.DashPayLib();
            dp1.bestBlockInfo.height = 105;
            expect(dp1.bestBlockInfo.height).to.not.equal(dp2.bestBlockInfo.height);
        });
    });

    describe('Stack Component-Chaining', function () {
        // TODO
    });

    describe('DashDrive integration to DashCore', function () {
        // TODO
    });
});
