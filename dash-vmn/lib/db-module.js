/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */
'use strict';
let VMN = require('../index.js');

/**
 * Singleton generic no-sql DB wrapper for test-stack server module persistence
 * @private
 */
class DB extends VMN.Base.ServerModule {

    singletonConstructor() {

        this.log('Loaded');

        // LowDB Specific...
        this.low = require('lowdb');

        if (typeof window === 'undefined') {
            this.FileSync = require('lowdb/adapters/FileSync');
            this.adapter = new this.FileSync('./stack-db.json');
        } else if (typeof process === 'object') {
            this.LocalStorage = require('lowdb/adapters/LocalStorage');
            this.adapter = new this.LocalStorage('db');
        }

        this.db = this.low(this.adapter);

        this.db.read();
        //VMN.Util.deleteFile(this.config.log.logFilePath);
    }

    /**
     * Adds a collection if it doesn't exist
     * @param collName
     * @returns collection
     */
    addCollection(collName) {

        this.db.set(collName, [])
            .write();

        this.db.read();
        return this.getCollection(collName);
    }

    /**
     * Insert object or return error if exists.
     *
     * If the collection doesn't exist, it must be created
     * @param collName
     * @param obj
     * @return Array of the collection's objects after insert or false if obj exists
     */
    insertToCollection(collName, obj) {

        if (!this.collectionExists(collName)) {
            this.addCollection(collName);
        }

        let obj2 = this.findInCollection(collName, obj);

        // TODO: this comparison will break if different property orders etc
        if (JSON.stringify(obj) !== JSON.stringify(obj2)) {
            let o = this.db.get(collName)
                .push(obj)
                .write();
            this.db.read();
            return o;
        }
        return false;
    }

    findInCollection(collName, obj) {
        return this.db.get(collName)
            .find(obj)
            .cloneDeep() // prevent changes saving back to stored data
            .value();
    }

    updateInCollection(collName, findObj, obj) {
        return this.db.get(collName)
            .find(findObj)
            .assign(obj)
            .write();
    }

    searchInCollection(collName, func) {
        return this.db.get(collName)
            .filter(func)
            .value();
    }

    insertToNestedCollection(outerColl, outerFindObj, innerColl, obj) {
        return this.db.get(outerColl)
            .find(outerFindObj)
            .get(innerColl)
            .push(obj)
            .write();
    }

    updateInNestedCollection(outerColl, outerFindObj, innerColl, innerFindObj, updObj) {
        return this.db.get(outerColl)
            .find(outerFindObj)
            .get(innerColl)
            .find(innerFindObj)
            .assign(updObj)
            .write();
    }

    removeFromNestedCollection(outerColl, outerFindObj, innerColl, obj) {
        return this.db.get(outerColl)
            .find(outerFindObj)
            .get(innerColl)
            .remove(obj)
            .write();
    }

    removeFromCollection(collName, obj) {
        return this.db.get(collName)
            .remove(obj)
            .write();
    }

    getCollection(collName) {
        return this.db.get(collName)
            .cloneDeep()
            .value();
    }

    getCollectionSize(collName) {
        //this.db.read();
        return this.db.get(collName)
            .size()
            .value();
    }

    collectionExists(collName) {
        return this.getCollection(collName);
    }

    cleanDB() {
        this.db.setState({}).write();
    }
}

module.exports = DB;
