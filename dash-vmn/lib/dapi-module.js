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
 * Virtual HTTPS Interface for DAPI test-stack module
 * @interface DAPI
 */
class DAPI extends VMN.Base.ServerModule {

    singletonConstructor() {

        this.db = new VMN.DB();

        // instantiate upstream stack
        this.DashDrive = new VMN.DashDrive();
        this.DashCore = new VMN.DashCore();

        this.log('Loaded');
        this.DashCore.events.addListener('newBlock', (data) => this._onNewBlock(data));
    }

    /**
     * Handles NewBlock ZMQ message from DashCore
     * @memberof DAPI
     * @param {object} block info object
     */
    _onNewBlock(blockInfo) {
        this.log('Detected New Block', JSON.stringify(blockInfo));
        this.bestBlockInfo.height = blockInfo.height;
        this.bestBlockInfo.hash = blockInfo.hash;

        this.events.emit('newBlock', this.bestBlockInfo);
    }

    /**
     * Create a Blockchain blockchainuser via a SubTX
     * @param subtx {json} Raw subtx
     * @memberof DAPI
     */
    CreateUser(obj) {
        this.log('Signup blockchainuser', obj.subtx.uname);
        let o = this.DashCore.sendrawsubtx(Schema.object.toJSON(obj));
        this.DashCore.mineBlock();
        return o;
    }

    /**
     * Returns a single BlockchainUser Schema object for the specified username
     * @param uname {string} Blockchain Username
     * @memberof DAPI
     */
    GetUserByName(uname) {
        if (!Schema.validate.username(uname)) {
            return null;
        }
        let bu = this.DashCore.getuserbyname(uname);
        return bu;
    }

    /**
     * Returns a single BlockchainUser Schema object for the specified uid
     * @memberof DAPI
     * @param uid
     */
    GetUserById(uid) {

        let bu = this.DashCore.getuserbyid(uid);
        return bu;
    }

    /**
     * Search for blockchain users who match a given search pattern
     * @memberof DAPI
     * @param {string} pattern - search string
     * @returns {array} Array of matching blockchain blockchainuser accounts
     */
    SearchUsers(pattern) {
        let results = this.DashCore.searchusers(pattern);
        return results;
    }

    GetDap(dapid) {
        return this.DashDrive.getDapContract(dapid);
    }

    SearchDaps(pattern) {
        return this.DashDrive.searchDapContracts(pattern);
    }

    /**
     * Returns a users current dataset from DashDrive
     * @param uname {string} Blockchain Username
     * @param dapid {string} Hash of the DAP Schema
     * @memberof DAPI
     */
    GetDapSpace(dapid, uid) {

        let state = this.DashDrive.getDapSpace(dapid, uid);

        return state;
    }

    GetDapContext(dapid, uid) {

        let state = this.DashDrive.getDapContext(dapid, uid);

        return state;
    }

    /**
     * Updates a Blockchain blockchainuser's DAP data in DashCore (hash) and DashDrive (data).
     * The DAP space to use is determined from the dapid (hash) in the provided transition packet
     * @param uname {string} Blockchain Username
     * @memberof DAPI
     */
    UpdateDapSpace(ts, tsp) {

        if (Schema.validate.stheader(ts).valid === false) {
            throw (new Error('Invalid stheader'));
        }

        let dapSchema = null;

        // if this is a dapobjects packet..
        if (tsp.stpacket.dapobjects) {

            // fetch the dapschema
            let dap = this.GetDap((tsp.stpacket.dapid));
            dapSchema = dap.dapcontract.dapschema;
        }

        if (Schema.validate.stpacket(tsp, dapSchema).valid === false) {
            throw (new Error('Invalid stpacket'));
        }

        // if valid, pin and broadcast the packet
        if (this.DashDrive.pinPacket(ts, tsp)) {

            // broadcast the transition via DashCore
            let tsJson = Schema.object.toJSON(ts);
            let tsid = this.DashCore.sendrawtransition(tsJson);

            this.DashCore.mineBlock();

            return tsid;
        }
    }

    getDapData(dapId, withWrappers = false) {
        return this.DashDrive.getDapData(dapId, withWrappers);
    }
}

module.exports = DAPI;
