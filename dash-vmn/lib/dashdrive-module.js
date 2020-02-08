/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../index.js');
let Schema = require('../../lib/index.js');

/**

 * Virtual instance of DashDrive
 * @interface DashDrive
 */
class DashDrive extends VMN.Base.ServerModule {

    singletonConstructor() {

        this.db = new VMN.DB();

        // Persisted-Data Namespaces used for DB lookups
        this.disk = {

            // confirmed packets have the blockid set in metadata
            packets: 'vmn.drive.packets',

            // index built from packets
            index: {

                // set of current objects across all users/DAPs
                dapobjects: 'vmn.drive.index.dapobjects',

                dapcontracts: 'vmn.drive.index.dapcontracts'
            }
        };

        // Instantiate a ref to the DashCore singleton
        this.DashCore = new VMN.DashCore();
        // ...and wire ZMQ events
        this.log('Loaded');
        this.DashCore.events.addListener('newBlock', (data) => this._onNewBlock(data));
    }

    /**
     * Import users and transitions from a DashCore block
     * @memberof DashDrive
     * @param {object} block info object
     */
    _onNewBlock(blockInfo) {
        this.log('Detected New Block', JSON.stringify(blockInfo));

        // get new transitions from the block
        let ts = this.DashCore.listtssinceblock(this.bestBlockInfo.hash);

        for (let i = 0; i < ts.length; i++) {
            if (ts[i].stheader.pakid) {
                this._commitPacket(ts[i], blockInfo);
            }
        }

        this.bestBlockInfo.height = blockInfo.height;
        this.bestBlockInfo.hash = blockInfo.hash;
    }

    /**
     * Pin a packet in local DashDrive (IPFS)
     *
     * Packets pinned on Quorum MNs are propagated (pulled by non-quorum MNs) once the packet hash exists in a state transition in a confirmed block
     *
     * @param ts {object} ST header
     * @param tsp {object} Transition Packet Data
     * @memberof DashDrive
     * @example <caption>transition packet containing Alice's DashPay DAPUser signup </caption>
     pinPacket({
              }
     });
     */
    pinPacket(ts, tsp) {

        if (!Schema.validate.stheader(ts)) {
            return null;
        }

        // if the packet has dap objects, we need to hash with the schema
        let dapSchema = null;
        if (tsp.stpacket.dapobjects) {
            dapSchema = this.getDapSchema(tsp.stpacket.dapid);
            if (!dapSchema) {
                throw new Error('dapschema not found');
            }
        }

        if (!Schema.validate.stpacket(tsp, dapSchema)) {
            return null;
        }

        // deep verify the packet
        let dapData = this.getDapData(tsp.stpacket.dapid, true);
        let dataValid = Schema.state.validateTransitionData(ts, tsp, dapData, dapSchema);
        if (!dataValid.valid) {
            this.logError('invalid packet');
            return null;
        }

        // store meta data (used locally for indexing)
        Schema.object.setID(tsp, dapSchema);
        tsp.stpacket.meta.tsid = ts.stheader.meta.id;
        tsp.stpacket.meta.uid = ts.stheader.uid;

        // don't pin duplicates - multiple packets can have same hash (only the stheader is unique)
        let existingPacket = this.db.findInCollection(this.disk.packets, {stpacket: {meta: {id: tsp.stpacket.meta.id}}});

        //if packet exists, don't insert, but still return success
        if (!existingPacket) {
            // save the packet to local disk
            let o = this.db.insertToCollection(this.disk.packets, tsp);

            this.log('pinned packet', o);
        }
        return tsp.stpacket.meta.id;
    }

    /**
     * Get a packet from local disk
     * @param pakid
     * @returns {*}
     * @private
     */
    _getPinnedPacket(pakid) {
        return this.db.findInCollection(this.disk.packets, function (o) {
            return (o.stpacket.meta.id === pakid && !o.stpacket.meta.block);
        });
    }

    _getConfirmedPacket(pakid) {
        return this.db.findInCollection(this.disk.packets, function (o) {
            return (o.stpacket.meta.id === pakid && o.stpacket.meta.block);
        });
    }

    /**
     * Gets a packet from p2p storage when its hash is confirmed in a block
     * @param ts {object} State Transition
     */
    _commitPacket(ts, blockInfo) {

        Schema.object.setID(ts);

        // get the packet for this transition
        let tsp = this._getPinnedPacket(ts.stheader.pakid);

        if (!tsp) {
            throw new Error('pinned packet not found');
        }

        // DAP Contract Packet
        if (tsp.stpacket.dapcontract) {

            // use the tsid as the dapid (clients will want the full ts/packet for verification)
            tsp.stpacket.dapcontract.meta.dapid = ts.stheader.meta.id;

            // create the DAP
            this.db.insertToCollection(this.disk.index.dapcontracts, {dapcontract: tsp.stpacket.dapcontract});

            // create dap data collection
            const dapData = {
                dapId: ts.stheader.meta.id,
                objects: []
            };

            this.db.insertToCollection(this.disk.index.dapobjects, dapData);
        }

        // DAP Data Packet
        else if (tsp.stpacket.dapobjects) {
            let dapId = tsp.stpacket.dapid;
            let userId = ts.stheader.uid;
            let dapData = this.getDapData(dapId, true);
            let dapContract = this.getDapContract(dapId);
            let dapSchema = dapContract.dapcontract.dapschema;

            // deep verify the packet (second time, first was during pin packet)
            let dataValid = Schema.state.validateTransitionData(ts, tsp, dapData, dapSchema);
            if (!dataValid.valid) {
                VMN.Util.throw(dataValid);
            }

            // Process dap objects
            let outerFindObj = {
                dapId
            };
            let innerColl = 'objects';
            let outerColl = this.disk.index.dapobjects;

            for (let i = 0; i < tsp.stpacket.dapobjects.length; i++) {
                const object = tsp.stpacket.dapobjects[i];
                const wrappedObject = {
                    userId,
                    data: object,
                };

                const innerFindObj = function (o) {
                    return o.data.id === object.id;
                };

                // else adding a new object
                if (object.act === 1) {
                    this.db.insertToNestedCollection(outerColl, outerFindObj, innerColl, wrappedObject);
                }
                // if updating an object
                else if (object.act === 2) {
                    this.db.updateInNestedCollection(outerColl, outerFindObj, innerColl, innerFindObj, wrappedObject);

                }
                // else deleting an object
                else if (object.act === 3) {
                    this.db.removeFromNestedCollection(outerColl, outerFindObj, innerColl, innerFindObj, wrappedObject);

                } else {
                    throw new Error('invalid dapobject action type');
                }
            }
        }

        // add the block hash to this packet's meta, signifying it as a confirmed packet
        tsp.stpacket.meta.block = blockInfo.hash;
        this.db.updateInCollection(this.disk.packets, {stpacket: {meta: {id: tsp.stpacket.meta.id}}}, tsp);
        this.log('confirmed packet', tsp);
    }

    getDapContract(dapid) {
        let o = this.db.findInCollection(this.disk.index.dapcontracts, {
            dapcontract: {
                meta: {
                    dapid: dapid
                }
            }
        });
        this.log('getDapSchema', o);
        return o;
    }

    searchDapContracts(pattern = '') {

        // TODO: should only return id, and uid - security risk by spoofing non-unique DAP names

        let daps = this.db.searchInCollection(this.disk.index.dapcontracts, function (o) {
            return o.dapcontract.dapname.indexOf(pattern) > -1;
        });
        return daps;
    }

    getDapSchema(dapid) {
        return this.getDapContract(dapid).dapcontract.dapschema;
    }

    /**
     * Get a user's own data from their DAP space or null if no objects
     * @param {string} dapId DAP id (hash of the DAP's first state transition)
     * @param {string} userId User id (hash of the user's first subtx)
     * @memberof DashDrive
     */
    getDapSpace(dapId, userId) {
        if (!dapId) {
            this.log('dapschema not specified');
            return null;
        }

        const dapData = this.getDapData(dapId, true);

        if (!dapData) {
            return null;
        }

        const dapSpace = dapData.filter(objectWrapper => objectWrapper.userId === userId)
            .map(objectWrapper => objectWrapper.data);

        this.log('getuserspace', dapSpace);

        return dapSpace;
    }

    /**
     * Get a User's DAP State, plus related objects from other user's states for that DAP
     * Enables derivation of the user's relational state, e.g. received a friend request
     *
     * @param uid
     * @param dapid
     * @param uid
     * @returns {{dapid: *, uid: *, objects: Array, related: Array}}
     */
    getDapContext(dapid, uid) {
        const context = {
            dapid: dapid,
            uid: uid,
            objects: null, // own objects
            related: null, // related objects
        };

        // get own objects
        const ownObjects = this.getDapSpace(dapid, uid);
        if (ownObjects) {
            context.objects = ownObjects;
        }

        // get related objects
        // TODO: these relations should be indexed on packet commit, not expensive-load of all data for the DAP
        const relatedObjects = this.getRelatedObjects(dapid, uid);
        if (relatedObjects.length > 0) {
            context.related = relatedObjects;
        }

        this.log('getdapspace', context);

        return context;
    }

    getDapSpacePackets(dapid, uid) {
        return this.db.searchInCollection(this.disk.packets, function (o) {
            return (o.stpacket.dapid === dapid && o.stpacket.meta.uid === uid && o.stpacket.meta.block);
        });
    }

    /**
     * Returns all dap spaces for the given dapId
     *
     * @param dapId
     * @param keepWrapper
     * @return {object[]|null}
     */
    getDapData(dapId, keepWrapper = false) {
        const dapData = this.db.findInCollection(this.disk.index.dapobjects, {dapId});

        if (!dapData) {
            this.log('dapschema not specified');
            return null;
        }

        let {objects} = dapData;

        if (!keepWrapper) {
            objects = objects.map(metaObject => {
                return metaObject.data;
            });
        }

        return objects;
    }

    /**
     * Checks whether the given object is related to other object or not
     *
     * @private
     * @param object
     * @param objectRelations
     * @param userId
     * @param {string} objectId
     * @return {boolean}
     */
    isObjectRelated(object, objectRelations, userId, objectId = undefined) {
        if (!objectRelations.length) {
            return false;
        }

        const relationField = objectRelations.find(propertyName => {
            const relation = object[propertyName];

            if (!relation) {
                return false;
            }

            const isUserEquals = relation.userId === userId;
            const isIndexEquals = !objectId || (relation.id === objectId && relation.type === object.objtype);

            return isUserEquals && isIndexEquals;
        });

        return Boolean(relationField);
    }

    /**
     * Returns all related objects for the given relation
     *
     * @param {string} dapId
     * @param {string} userId
     * @param {string} objectId
     */
    getRelatedObjects(dapId, userId, objectId = undefined) {

        const schema = this.getDapContract(dapId).dapcontract.dapschema;
        let relations = Schema.definition.getSchemaRelations(schema);

        return this.getDapData(dapId, true)
            .filter(objectWrapper => {
                const {data: object} = objectWrapper;
                const {objtype: objectType} = object;

                if (!relations[objectType] || !this.isObjectRelated(object, relations[objectType], userId, objectId)) {
                    return false;
                }

                // pack metadata for clients (they can SPV this, alternatively return
                // the TS header / packet merkle proof for each obj)

                // add the uid to the meta - can be SPV verified on clients by looking up
                // the related stpacket via the uid and object's idx and then verifying the stheader
                Schema.object.setMeta(object, 'uid', objectWrapper.userId);

                const bu = this.DashCore.getuserbyid(objectWrapper.userId);
                Schema.object.setMeta(object, 'uname', bu.blockchainuser.uname);

                return true;
            })
            .map(objectWrapper => objectWrapper.data);
    }
}

module.exports = DashDrive;
