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
 * Virtual RPC Interface for DashCore test-stack module.
 *
 * Non-schema (internal) data objects (such as blocks) are specified inline within this class
 * @interface DashCore
 */
class DashCore extends VMN.Base.ServerModule {

    singletonConstructor() {

        this.log('Loaded');

        this.db = new VMN.DB();

        // create a dashdrive instance just to wire events (Core doesn't call DD direct)
        this._dd = new VMN.DashDrive();

        // persistent data namespace lookup
        this.disk = {

            blocks: 'vmn.core.blockchain',

            // BUs derived from confirmed subTx in blocks
            users: 'vmn.core.index.users',
        };

        this.mempool = {
            subtx: 'vmn.core.mempool.subtx',
            stheaders: 'vmn.core.mempool.stheaders'
        };

        // Start a new chain with a genesis block every time DashCore starts
        this.mineBlock();
    }

    /*******************************************************
     * Util Methods (Internal stack helpers)
     *******************************************************/

    reorgChain() {
        // TODO
        return null;
    }

    /**
     * Mine mempool subtx and ts to a new block
     *
     * ...we currently don't care about payment tx for L2 test purposes
     * (although subtx verification will need this)
     * @private
     */
    mineBlock() {

        // simplifed block structure for L2 test purposes
        let block = {
            hash: null, // hash of the other fields
            height: this.bestBlockInfo.height + 1,
            prevhash: null, // hash of previous block
            subtx: [], // meta data from tx with subtx metadata
            stheaders: [] // transitions
        };

        // create a new empty block
        if (this.bestBlockInfo.height > 0) {
            block.prevhash = this.bestBlockInfo.hash;
        }

        // add subtx from mempool to block
        let subtxs = this.db.getCollection(this.mempool.subtx) || [];
        if (!(!Array.isArray(subtxs) || !subtxs.length)) {

            for (let i = 0; i < subtxs.length; i++) {


                let bu = Schema.create.blockchainuser(subtxs[i]);
                let valid = Schema.validate.blockchainuser(bu);
                if (valid.valid) {
                    if (!bu.blockchainuser.meta) {
                        bu.blockchainuser.meta = {};
                    }
                    bu.blockchainuser.meta.height = block.height;
                    this.db.insertToCollection(this.disk.users, bu);

                    // write the subtx on the chain
                    //this.db.insertToCollection(this.disk.subtx, subtxs[i]);


                    block.subtx.push(subtxs[i]);
                } else {
                    throw ('invalid BU derivation of subtx');
                }

                // remove subtx from the mempool
                this.db.removeFromCollection(this.mempool.subtx, subtxs[i]);
            }
        }

        // add transitions from mempool to block
        let stheaders = this.db.getCollection(this.mempool.stheaders) || [];
        if (!(!Array.isArray(stheaders) || !stheaders.length)) {
            for (let i = 0; i < stheaders.length; i++) {

                if (Schema.validate.stheader(stheaders[i])) {

                    // write the transition on the chain in searchable list
                    //this.db.insertToCollection(this.disk.stheaders, stheaders[i]);

                    // store the header
                    block.stheaders.push(stheaders[i]);
                }
                // remove transition from the mempool
                this.db.removeFromCollection(this.mempool.stheaders, stheaders[i]);
            }
        }

        // chain to previous block hash
        if (this.bestBlockInfo.height === 0) {
            // genesis
            block.prevhash = '0000000000000000000000000000000000000000000000000000000000000000';
        } else {
            block.prevhash = this.bestBlockInfo.hash;
        }

        // hash the block
        block.hash = Schema.util.hash.toHash(JSON.stringify(subtxs)
            + JSON.stringify(stheaders)
            + JSON.stringify(block.prevhash));

        // update tip
        this.bestBlockInfo.height++;
        this.bestBlockInfo.hash = block.hash;
        block.height = this.bestBlockInfo.height;

        // persist the block onto the chain
        this.db.insertToCollection(this.disk.blocks, block);


        this.log('Mined Block', JSON.stringify(this.bestBlockInfo));

        // fire zmq event
        this.events.emit('newBlock', this.bestBlockInfo);

        return block;
    }

    /*******************************************************
     * RPC interface
     *******************************************************/

    /**
     * Register a BCU on the chain via a subtx
     *
     * (test stack just uses subtx metadata as payments not implemented yet)
     * @param subTxJson {string} JSON representation of the SubTX metadata
     */
    sendrawsubtx(subTxJson) {

        // TODO: Validate by DIP 011 consensus rules

        try {
            let subtx = JSON.parse(subTxJson);

            Schema.object.setID(subtx);

            let valid = Schema.validate.subtx(subtx);

            // make sure name not in use:
            if (this.getuserbyname(subtx.subtx.uname)) {
                return null;
            }

            if (!valid.valid) {
                this.logError('sendrawsubtx', JSON.stringify(valid));
                return false;
            }
            let o = this.db.insertToCollection(this.mempool.subtx, subtx);
            this.log('sendrawsubtx', o);
            return Schema.hash.subtx(subtx);

        } catch (e) {
            this.logError('sendrawsubtx', e.toString());
            return null;
        }
    }

    /**
     * Validates a state transition and broadcasts to the network
     * @param tsJSON {string} JSOn representation of the raw transition
     * @returns TSID or null
     */
    sendrawtransition(tsJSON) {

        try {
            let ts = JSON.parse(tsJSON);
            let valid = Schema.validate.stheader(ts);

            if (!valid.valid) {
                this.logError('sendrawts', JSON.stringify(valid));
                return null;
            }

            let o = this.db.insertToCollection(this.mempool.stheaders, ts);

            this.log('sendrawts', o);
            let tsid = Schema.hash.stheader(ts);
            return tsid;

        } catch (e) {
            this.logError('sendrawts', e.toString());
            return null;
        }
    }

    /**
     * Returns a BU by name
     * @param uname {string} Blockchain Username
     */
    getuserbyname(uname) {

        let bu = this.db.findInCollection(this.disk.users, {blockchainuser: {uname: uname}});
        return bu;
    }

    /**
     * Returns a BU by name
     * @param uid {string} Blockchain User ID (hash of first subtx for the username)
     */
    getuserbyid(uid) {

        let bu = this.db.findInCollection(this.disk.users, {blockchainuser: {uid: uid}});
        return bu;
    }

    /**
     * Returns a list of BU names that match the given search pattern
     * @param {string} pattern - search string must be 1 or more chars
     * @returns {array} Array of matching blockchain blockchainuser names
     */
    searchusers(pattern) {
        if (pattern.length < 1) return;

        let bu = this.db.searchInCollection(this.disk.users, function (o) {
            return o.blockchainuser.uname.indexOf(pattern) > -1;
        });
        return bu;
    }

    /**
     * Returns a block with the given hash
     * @param {string} Block hash
     */
    getblock(hash) {
        return this.db.findInCollection(this.disk.blocks, {hash: hash});
    }

    /**
     * Return a Transition by id
     * @param tsid {string} Transition ID
     */
    gettransition(tsid) {
        return this.db.findInCollection(this.disk.stheaders, {stheader: {meta: {id: tsid}}});
    }

    /**
     * List blockchain users since the block with the specified hash
     * @param {string} Block hash
     */

    /*
    listsubtxsinceblock(hash) {

        let height = 1;
        if (hash) {
            let b = this.getblock(hash);
            if (b) {
                if (b.hash) {
                    height = b.height;
                }
            }
        }

        let foundSubTX = [];
        for (let i = height; i <= this.bestBlockInfo.height; i++) {
            this.logInfo('listsubtxsinceblock' + i);
            let b = this.db.findInCollection(this.disk.blocks, {height: i});
            if (b) {
                for (let j = 0; j < b.subtx.length; j++) {
                    let id = b.subtx[j].subtx.meta.id;
                    let pattern = {
                        subtx:
                            {
                                meta:
                                    {id: id}
                            }
                    };
                    let o = this.db.findInCollection(this.disk.subtx, pattern);
                    foundSubTX.push(o);
                }
            }
        }
        return foundSubTX;
    }
    */

    /**
     * List transition headers since the block with the specified hash
     * @param {string} Block hash
     */
    listtssinceblock(inpHash) {

        let inpHeight = 1;

        // if not genesis, get height of the inpHash block
        if (inpHash) {
            let b = this.getblock(inpHash);
            if (b) {
                if (b.hash) {
                    inpHeight = b.height;
                }
            }
        }

        let foundTs = [];
        for (let i = this.bestBlockInfo.height; i > inpHeight ; i--) {

            let b = this.db.findInCollection(this.disk.blocks, {height: i});
            if (b) {
                for (let j = 0; j < b.stheaders.length; j++) {
                    foundTs.push(b.stheaders[j]);
                }
            }
        }
        return foundTs;
    }

    /**
     * Enable publish block ts packets in <addresss>
     */
    zmqpubblocktsp() {
        // not needed in virtual stack
        return null;
    }
}

module.exports = DashCore;
