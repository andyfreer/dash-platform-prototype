/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let data = require('../../data/contactsdap-test-data.json');
let expect = require('chai').expect;

describe('SubTx tests \n  ---------------------', function () {

    after(function (done) {

        done();
    });

    describe('Subtx hash', function () {

        it('validate a subtx hash', function () {

            // TODO: use independent hash generation (this is same as in the test-data generator)
            expect(Schema.hash.subtx(data.alice_subtx_1)).to.equal(data.alice_subtx_1.subtx.meta.id);
        });
    });

    describe('subtx raw', function () {

        it('valid subtx', function () {

            data.valid_subtx = {
                subtx: {
                    pver: 1,
                    action: 1,
                    uname: 'alice',
                    pubkey: '024964f06ea5cfec1890d7e526653b083c12360f79164c1e8163327d0849fa7bca',
                    meta: {
                        sig: 'INxlyf9JX8j1hfcBNf5W72+UALu7+5nF8l/MfUZSJlomNDkmwWfvva4eE4/tjJPUO+ByV6K3cbUgPhjbEZIM8Ik='
                    }
                }
            };
            expect(Schema.validate.subtx(data.valid_subtx).valid).to.be.true;
        });
    });
});

