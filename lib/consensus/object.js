/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
/**
 * @fileOverview Consensus code for Schema instance manipulation
 * @module Schema.object
 */
let Schema = require('../index.js');
let Hash = require('@dashevo/dashcore-lib').crypto.Hash;

/**
 * Set id (hash) of an instance within the metadata
 * @param obj {object} Schema object instance
 * @param dapSchema {object} DapSchema
 */
function setID(obj, dapSchema) {
    setMeta(obj, 'id', toHash(obj, dapSchema));
}

/**
 * Set metadata property value in a Schema object instance
 * @param obj {object} Schema object instance
 * @param metakey {string} Meta section keyword
 * @param val {*} value
 */
function setMeta(obj, metakey, val) {

    let typeProp = null;

    if (isSysObject(obj)) {
        // pull the sysobject subschema
        typeProp = obj[Object.keys(obj)[0]];
    } else {
        // dap object
        typeProp = obj;
    }

    if (!typeProp.meta) {
        typeProp.meta = {};
    }

    typeProp.meta[metakey] = val;

    return obj;
}

/**
 * Classify an object as a System Object without validation
 * @param obj
 * @returns {boolean}
 */
function isSysObject(obj) {

    if (obj === undefined || obj === null) {
        return false;
    }

    // first property should be the subschema
    let subschemaName = Object.keys(obj)[0];

    let keys = Object.keys(Schema.System.properties);
    // iterate through sys schema properties
    for (let i = 0; i < keys.length; i++) {

        let schemaPropName = keys[i];

        if (subschemaName === schemaPropName) {
            return true;
        }
    }

    return false;
}

/**
 * Clone a Schema instance by extracting only Schema defined properties
 * Optionally specify a dapSchema to clone a DAP Object
 * @param obj {object} Schema object instance
 * @param dapSchema {object} DapSchema (optional)
 * @returns {*}
 */
function fromObject(obj, dapSchema) {

    if (!obj) {
        return null;
    }

    // deep clone JS obj to dereference (we only clone props not methods)
    let objCopy = Schema.util.object.toClone(obj);

    Schema.util.jsonschema.extractSchemaObject(objCopy, dapSchema);

    // return cloned object
    return objCopy;
}

/**
 * Return a hash of a Schema object instance
 * @param obj {object} Schema object instance
 * @param dapSchema {object} DapSchema
 * @returns {*}
 */
function toHash(obj, dapSchema) {

    // detect subschema
    switch (Object.keys(obj)[0]) {
        case 'subtx':
            return Schema.hash.subtx(obj);
        case 'blockchainuser':
            return Schema.hash.blockchainuser(obj);
        case 'stheader':
            return Schema.hash.stheader(obj);
        case 'stpacket':
            return Schema.hash.stpacket(obj, dapSchema);
        case 'dapcontract':
            return Schema.hash.dapcontract(obj);
        case 'dapschema':
            return Schema.hash.dapschema(obj);
        default:
            // dapobjects have userdefined subschema
            return Schema.hash.dapobject(obj, dapSchema);
    }
}

/**
 * Returns a JSON representation of a Schema object instance
 * @param obj {object} Schema object instance
 * @param dapSchema {object} DapSchema (optional)
 * @returns {string}
 */
function toJSON(obj, dapSchema) {

    let o = fromObject(obj, dapSchema);

    return Schema.util.object.toJSON(o);
}

/**
 * Generate primary key
 *
 * @param {object} object DAP Object
 * @param {object} dapSchema DAP Schema
 * @param {string} userId
 * @returns {string|null}
 */
function composePrimaryKey(object, dapSchema, userId) {
    const subSchema = dapSchema[object.objtype];
    if (!subSchema.primaryKey || subSchema.primaryKey.composite !== true) {
        return null;
    }

    let primaryKeyData = Buffer.from(userId);
    if (subSchema.primaryKey.includes && subSchema.primaryKey.includes.length > 0) {
        const additionalFields = subSchema.primaryKey.includes.map(name => object[name]);
        primaryKeyData = Buffer.concat([primaryKeyData, Schema.util.cbor.serialize(additionalFields)]);
    }

    // TODO Choose more appropriate hashing algorithm
    return Hash.sha1(primaryKeyData).toString('hex');
}

module.exports = {
    composePrimaryKey,
    setID: setID,
    setMeta: setMeta,
    fromObject: fromObject,
    toJSON: toJSON,
    isSysObject: isSysObject
};
