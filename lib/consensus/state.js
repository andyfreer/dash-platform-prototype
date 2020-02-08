/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
/**
 * @fileOverview State validation
 * @module Schema.state
 */
let Schema = require('../index.js');

/**
 * Fully validate a State Transition against a DapSpace instance
 * @param ts {object} State Transition instance
 * @param tsp {object} State Transition Packet instance
 * @param dapData {object[]} DapSpace instance
 * @param dapSchema {object} DapSchema instance
 * @returns {*}
 */
function validateTransitionData(ts, tsp, dapData, dapSchema) {
    // is this a dapobject packet
    if (tsp.stpacket.dapobjects) {

        if (!dapSchema) {
            throw new Error('dapSchema not provided during validation');
        }

        // Check if the packet is valid to merge into the user's active state for this DAP
        let tspValid = Schema.validate.stpacketobjects(tsp.stpacket.dapobjects, dapSchema);
        if (tspValid.valid !== true) {
            return tspValid;
        }

        if (dapData && dapData.length > 0) {
            // TODO Does it make sense?
            let stateValid = _validateDapData(dapData, dapSchema);
            if (stateValid.valid !== true) {
                return stateValid;
            }
        }

        let idValid = _validateId(ts, tsp, dapSchema);
        if (idValid.valid !== true) {
            return idValid;
        }

        let idUniquenessValid = _validateIdUniqueness(ts, tsp, dapData);
        if (idUniquenessValid.valid !== true) {
            return idUniquenessValid;
        }

        let relationsValid = _validateRelations(ts, tsp, dapData, dapSchema);
        if (relationsValid.valid !== true) {
            return relationsValid;
        }

    } else {
        // TODO: verify dapcontract
    }
    return Schema.result();
}

/**
 * Validate id uniqueness in a DapSpace instance
 *
 * @private
 * @param {object} ts State Transition instance
 * @param {object} tsp State Transition Packet instance
 * @param {object} dapSchema DAP Schema
 * @returns {{valid, validateErrors}}
 */
function _validateId(ts, tsp, dapSchema) {
    for (let i = 0; i < tsp.stpacket.dapobjects.length; i++) {

        const object = tsp.stpacket.dapobjects[i];

        const primaryKey = Schema.object.composePrimaryKey(object, dapSchema, ts.stheader.uid);
        if (primaryKey !== null && object.id !== primaryKey) {
            return Schema.result('Invalid Object ID');
        }
    }

    return Schema.result();
}

/**
 * Validate id uniqueness in a DapSpace instance
 *
 * @private
 * @param ts {object} State Transition instance
 * @param tsp {object} State Transition Packet instance
 * @param dapData {object} Dap Data
 * @returns {object}
 */
function _validateIdUniqueness(ts, tsp, dapData) {

    // TODO: recursively check updated state as packet objects are applied

    // for each packet object
    for (let i = 0; i < tsp.stpacket.dapobjects.length; i++) {

        let pakObj = tsp.stpacket.dapobjects[i];

        // Clone array and remove current object
        const packetObjects = tsp.stpacket.dapobjects.slice(0);
        delete packetObjects[i];

        const duplicateInPacket = packetObjects.find((obj) => {
            return obj && pakObj.objtype === obj.objtype &&
                pakObj.act === 1 && obj.act === 1 &&
                pakObj.id === obj.id;
        });

        if (duplicateInPacket) {
            return Schema.result('duplicate object ID in the ST packet');
        }

        // checks against current state
        if (dapData && dapData.length > 0) {
            switch (pakObj.act) {
                case 1: {
                    const duplicateInSpace = dapData.find((objectWrapper) => {
                        return pakObj.objtype === objectWrapper.data.objtype &&
                            pakObj.id === objectWrapper.data.id;
                    });

                    if (duplicateInSpace) {
                        return Schema.result('duplicate object ID in DAP data');
                    }
                    break;
                }
                case 2:
                case 3: {
                    const presentInSpace = dapData.find((objectWrapper) => {
                        return pakObj.objtype === objectWrapper.data.objtype &&
                            pakObj.id === objectWrapper.data.id;
                    });

                    if (presentInSpace) {
                        if (presentInSpace.userId !== ts.stheader.uid) {
                            return Schema.result('object with specified ID belongs to another user');
                        }
                    } else {
                        return Schema.result('object ID in not present in DAP data');
                    }
                    break;
                }
            }
        }
    }
    return Schema.result();
}

/**
 * Validate relations in a DapSpace
 * @param ts {object} State Transition instance
 * @param tsp {object} State Transition Packet instance
 * @param dapData {object} DapSpace instance
 * @param dapSchema {object} DapSchema instance
 * @returns {object}
 */
function _validateRelations(ts, tsp, dapData, dapSchema) {
    // for each packet object
    for (let i = 0; i < tsp.stpacket.dapobjects.length; i++) {

        let object = tsp.stpacket.dapobjects[i];

        const relations = Schema.definition.getSubSchemaRelations(dapSchema, object.objtype);

        // Prevent objects related to self
        for (let j = 0; j < relations.length; j++) {
            const relationName = relations[j];

            if (object[relationName] && object[relationName].userId === ts.stheader.uid) {
                return Schema.result('object cannot relate to self');
            }
        }

        // TODO: validate foreign relational data
    }

    return Schema.result();
}

/**
 * Validate a DapSpace data
 * @param {object[]} dapData
 * @param {object} dapSchema DapSchema instance
 * @returns {*}
 */
function _validateDapData(dapData, dapSchema) {

    const dapDataWithoutWrappers = dapData.map(objectWrapper => objectWrapper.data);

    let result = Schema.validate.stpacketobjects(dapDataWithoutWrappers, dapSchema);
    if (!result.valid) {
        return result;
    }

    for (let i = 0; i < dapDataWithoutWrappers.length; i++) {

        for (let j = 0; j < dapDataWithoutWrappers.length; j++) {
            if (i !== j) {

                // duplicate index
                if (dapDataWithoutWrappers[i] === dapDataWithoutWrappers[j]) {
                    return Schema.result('duplicate object index in DapSpace');
                }
            }
        }
    }
    return Schema.result();
}

module.exports = {
    validateTransitionData
};
