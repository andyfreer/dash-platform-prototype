/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;
let contactsDapSchema = require('../../daps/contactsdap');

describe('DAP Contract Tests\n  ---------------------', function () {

    describe('dapcontract schema', function () {

        it('valid dapcontract schema', function () {

            let valid = Schema.compile.dapschema(contactsDapSchema);

            expect(valid.valid).to.be.true;
        });

        it('valid dapcontract container', function () {

            let dap = {
                dapcontract: {
                    description: 'valid registration of a new DAP on the chain', // for debugging
                    idx: 0,
                    dapid: 'abcdef',
                    dapname: 'DashPay',
                    dapver: '1',
                    dapschema: contactsDapSchema // here we store the actual schema from above
                }
            };

            let valid = Schema.validate.dapcontract(dap);

            expect(valid.valid).to.be.true;
        });
    });
});
