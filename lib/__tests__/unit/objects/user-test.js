/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let Schema = require('../../../index.js');
let expect = require('chai').expect;

describe('Usernames\n  ---------------------', function () {

    function testValidChar(i) {
        // DIP 11 compliant UTF-8 char codes (decimal)
        return (i > 47 && i < 58) // 0-9
            || (i > 96 && i < 123) // a-z
            || (i === 46) // .
            || (i === 95); // _
    }

    describe('Valid Usernames', function () {

        it('min length username', function () {
            expect(Schema.validate.username('ali')).to.be.true;
        });
        it('max length username', function () {
            expect(Schema.validate.username('alicealicealicealicealic')).to.be.true;
        });
        it('allowed chars', function () {

            let hasInvalidChar = false;
            for (let i = 0; i < 65536; i++) {
                if (testValidChar(i)) {
                    let uname = 'alice' + String.fromCharCode(i);
                    if (Schema.validate.username(uname) === false) {
                        hasInvalidChar = true;
                        break;
                    }
                }
            }
            expect(hasInvalidChar).to.be.false;
        });
    });

    describe('Invalid Usernames', function () {

        it('less than min chars', function () {
            expect(Schema.validate.username('al')).to.be.false;
        });
        it('more than max chars', function () {
            expect(Schema.validate.username('alicealicealicealicealice')).to.be.false;
        });
        it('disallowed chars', function () {

            let hasValidChar = false;
            for (let i = 0; i < 65536; i++) {
                if (testValidChar(i) === false) {
                    let uname = 'alice' + String.fromCharCode(i);
                    if (Schema.validate.username(uname) === true) {
                        hasValidChar = true;
                        break;
                    }
                }
            }
            expect(hasValidChar).to.be.false;
        });
    });
});
