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

    describe('DB Unit', function () {

        let collName = 'selftest';
        let obj1 = {id: 1};
        let obj2 = {id: 2};

        it('should create a collection', function () {
            let da = new VMN.DAPI();
            da.db.addCollection(collName);
            let o = da.db.getCollection(collName);
            expect(o).to.exist;
        });
        it('should add object to collection', function () {
            let da = new VMN.DAPI();
            let c = da.db.insertToCollection(collName, obj1);
            expect(c[0].id).to.equal(1);
        });

        it('should find object in collection', function () {
            let da = new VMN.DAPI();
            let c = da.db.findInCollection(collName, obj1);
            expect(c).to.exist;
        });

        it('should not find object from mutated query', function () {
            let da = new VMN.DAPI();
            let c = da.db.findInCollection(collName, obj2);
            expect(c).to.not.exist;
        });

        it('should not insert duplicate object to collection', function () {
            let da = new VMN.DAPI();
            let c = da.db.insertToCollection(collName, obj1);
            expect(c).to.equal(false);
        });

        it('should insert additional unique object to collection', function () {
            let da = new VMN.DAPI();
            da.db.insertToCollection(collName, obj2);
            let c2 = da.db.findInCollection(collName, obj2);
            expect(c2).to.exist;
        });

        it('should return an array of all objects in a collection', function () {
            let da = new VMN.DAPI();
            let c = da.db.getCollection(collName);
            expect(c.length > 1).to.be.true;
        });

        it('should remove an object from collection', function () {
            let da = new VMN.DAPI();
            da.db.removeFromCollection(collName, obj1);
            let c2 = da.db.findInCollection(collName, obj1);
            expect(c2).to.not.exist;
        });

        it('should remove all objects from collection', function () {
            let da = new VMN.DAPI();
            da.db.removeFromCollection(collName);
            let c2 = da.db.findInCollection(collName, obj2);
            expect(c2).to.not.exist;
        });

        it('should delete all db data', function () {
            let da = new VMN.DAPI();
            da.db.cleanDB();
            let c2 = da.db.collectionExists(collName);
            expect(c2).to.not.exist;
        });
    });
});
