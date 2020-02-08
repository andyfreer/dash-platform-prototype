/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../index.js');
let Schema = require('../../lib/index.js');
let Bitcore = require('@dashevo/dashcore-lib');
let {Message} = Bitcore;
const ObjectId = require('bson-objectid');

/**
 * Client, referenced by client Dap libs (e.g. DashPayLib), encapsulates connection
 * to DAPI
 * @interface Client
 * @extends VMN.Base.ModuleBase
 */
class Client extends VMN.Base.ModuleBase {
    constructor(config = null) {
        super();

        // instantiate upstream virtual stack
        this.DAPI = config && config.DAPIAdapter || new VMN.DAPI();

        // state of current user
        this._isAuthed = false;
        this._currentUser = null;
        this._currentUserPrvKey = null;
        this.dapContext = null;

        // state of current dap
        this._dapContract = null;

        // config
        if (config) {
            this.config = config;
        } else {
            this.config = {};
        }

        // events
        this.DAPI.events.addListener('newBlock', (data) => this._onNewBlock(data));
        // create test users and the DashPay DAP contract on the chain
        this.testHelper = new VMN.TestHelper(this);

        this.events.addListener('stateUpdated', (data) => this._onStateUpdated(data));

        this.updateCallbacks = [];

        if (this.onStart) this.onStart();
    }

    /**
     * Updated state for this user from DAPI
     * @param userState
     * @private
     */
    _onStateUpdated() {

        if (this.dapContext) {
            if (this.onUpdate) this.onUpdate();
        }

        // fire events
        for (let i = 0; i < this.updateCallbacks.length; i++) {
            this.updateCallbacks[i]();
        }

        this.events.emit('userStateUpdated', {});
    }

    /**
     * Allow frontend to attach an update event listener
     * @param cb {function} Callback
     */
    addUpdateListener(cb) {
        this.updateCallbacks.push(cb);
    }

    /**
     * Allow frontend to remove an update event listener
     * @param cb
     */
    removeUpdateListener(cb) {
        let idx = this.updateCallbacks.findIndex(o => o === cb);
        this.updateCallbacks.slice(idx);
    }

    async genTestData() {
        let dapContract = await this.testHelper.GenTestData(this.config.numTestUsers);
        if (dapContract) {
            this.setDap(dapContract);
        }
    }

    // quick version of user state update event for demo (state is updated on every new block)
    _onNewBlock(blockInfo) {
        this.bestBlockInfo.height = blockInfo.height;
        this.bestBlockInfo.hash = blockInfo.hash;

        if ((this._dapContract) && (this._isAuthed)) {
            this._fetchUserDapContext();
        }
    }

    /*******************************************************
     * User
     *******************************************************/

    async login(username) {

        this.logout();

        // TODO: authenticate blockchainuser sig
        this._currentUser = await this.getUser(username);

        if (typeof this._currentUser === 'undefined') {
            throw (new Error('User not found'));
        }

        if (!Schema.validate.blockchainuser(this._currentUser).valid) {
            throw (new Error('User object invalid'));
        }

        this._isAuthed = true;
        await this._fetchUserDapContext();
    }

    logout() {
        this._isAuthed = false;
        this._currentUser = null;
        this._currentUserPrvKey = null;
        this.dapContext = null;
    }

    checkAuth() {
        if (this.hasAuth() === false) {
            throw (new Error('User not authenticated'));
        }
        return true;
    }

    hasAuth() {
        return !(this._isAuthed === false || !this._currentUser);
    }

    async createBlockchainUser(uname, prvkey) {

        // create the subtx metadata (we are only simulating so we don't handle actual signup tx / fee
        let tx = {

            subtx: {
                debug: 'valid - registration subtx meta for ' + uname,
                pver: 1,
                action: 1, //1=“Register”, 2=“Topup”, 3=“ChangePubKey”, 4=“Deactivate”
                uname: uname,
                pubkey: new Bitcore.HDPrivateKey(prvkey).derive("m/0'").publicKey.toString()
            }
        };

        // derive the idl
        Schema.object.setID(tx);

        let sig = Message(tx.subtx.meta.id).sign(new Bitcore.HDPrivateKey(prvkey).derive("m/0'").privateKey);
        tx.subtx.meta.sig = sig;

        let txid = await this.DAPI.CreateUser(tx);

        return txid;
    }

    /**
     * Find a BCU on the blockchain by name
     */
    async getUser(uname) {

        if (!Schema.validate.username(uname)) {
            throw new Error('Invalid username');
        }

        let bu = await this.DAPI.GetUserByName(uname);

        if (!bu) {
            throw new Error('Username not found');
        }

        return bu;
    }

    /**
     * Find a BCU on the blockchain by name
     */
    async getUserById(uid) {

        let bu = await this.DAPI.GetUserById(uid);

        if (!bu) {
            throw new Error('User id not found');
        }
        return bu;
    }

    /**
     * Find a user by string pattern
     * @param pattern {string}
     * @returns {Promise<void>}
     */
    async searchUsers(pattern) {

        let res = await this.DAPI.SearchUsers(pattern);

        if (res) {
            // temp hack to match evo-contacts-list data format
            for (let i = 0; i < res.length; i++) {
                res[i].name = res[i].blockchainuser.uname;
                //res[i].data.aboutMe = "about me";
                //res[i].data.avatar = "avatar";
            }
        }
        return res;
    }

    getPayAddress(hdextpubkey, i) {
        let payPubKey = Bitcore.HDPublicKey.fromString(hdextpubkey);
        let derivedAddress = new Bitcore.Address(payPubKey.derive(i).publicKey, Bitcore.Networks.testnet).toString();
        return Bitcore.Address.fromString(derivedAddress).toString();
    }


    /*******************************************************
     * DAPs
     *******************************************************/

    /**
     * Signup an existing Blockchain User to a DAP.  This
     * creates a signup object in the user's dap space
     * @param obj
     */
    async _signup(obj) {
        this.checkAuth();
        this.checkDap();

        return this.commitSingleObject(obj);
    }

    async _fetchUserDapContext() {
        if (this.hasAuth() && this.hasDap()) {
            // TODO: differential state update / chain sync
            let dapid = this._dapContract.dapcontract.meta.dapid;
            this.dapContext = await this.DAPI.GetDapContext(dapid, this._currentUser.blockchainuser.uid);
            this.log('Client fetched updated state', JSON.stringify(this._currentUser.blockchainuser.uid));
            this.events.emit('stateUpdated', this.bestBlockInfo);
        }
    }

    async getDap(dapid) {
        return this.DAPI.GetDap(dapid);
    }

    setDap(dapContract) {

        let contractValid = Schema.validate.dapcontract(dapContract);
        if (!contractValid.valid) {
            throw new Error('Invalid DAP contract');
        }

        this._dapContract = dapContract;
    }

    async searchDaps(pattern) {
        return this.DAPI.SearchDaps(pattern);
    }

    checkDap() {
        if (!this.hasDap()) {
            throw (new Error('dapContract not loaded'));
        }
        return true;
    }

    hasDap() {
        if (this._dapContract) {
            return true;
        }
        return false;
    }

    async createDap(dapSchema) {

        this.checkAuth();

        let _dapContract = Schema.create.dapcontract(dapSchema);

        this.checkAuth();

        // create a packet
        let tsp = Schema.create.stpacket();
        tsp.stpacket.dapcontract = _dapContract.dapcontract;
        tsp.stpacket.dapid = _dapContract.dapcontract.meta.dapid;
        Schema.object.setID(tsp);
        let validTsp = Schema.validate.stpacket(tsp);
        if (validTsp.valid === false) {
            return validTsp;
        }

        // create a transition
        let ts = Schema.create.stheader(tsp.stpacket.meta.id, this._currentUser.blockchainuser.uid);
        Schema.object.setID(ts);
        let validTs = Schema.validate.stheader(ts);
        if (validTs.valid === false) {
            return validTs;
        }

        let tsid = await this.DAPI.UpdateDapSpace(ts, tsp);
        return tsid;
    }

    async addObject(schemaObj) {
        this.checkAuth();
        this.checkDap();

        schemaObj.act = 1;
        schemaObj.rev = 0;

        return this.commitSingleObject(schemaObj);
    }

    async updateObject(schemaObj) {
        this.checkAuth();
        this.checkDap();

        schemaObj.act = 2;
        schemaObj.rev = schemaObj.rev + 1;

        return this.commitSingleObject(schemaObj);
    }

    async removeObject(schemaObj) {
        this.checkAuth();
        this.checkDap();

        schemaObj.act = 3;
        schemaObj.rev = schemaObj.rev + 1;
        schemaObj.hdextpubkey = '';

        return this.commitSingleObject(schemaObj);
    }

    /**
     * Commit a single object in a State Transition to DAPI
     * TODO: we should batch changes on the client then create the Ts so fee isn't charged each time
     * @param schemaObj
     */
    async commitSingleObject(schemaObj) {

        this.checkAuth();
        this.checkDap();

        if (schemaObj.id === undefined) {
            schemaObj.id = Schema.object.composePrimaryKey(
                schemaObj,
                this._dapContract.dapcontract.dapschema,
                this._currentUser.blockchainuser.uid
            );

            if (schemaObj.id === null) {
                ObjectId.setMachineID(this._currentUser.blockchainuser.uid);
                const objectId = new ObjectId();
                schemaObj.id = objectId.toHexString();
            }
        }

        // create a packet
        let tsp = Schema.create.stpacket();

        tsp.stpacket.dapobjects = [schemaObj];

        tsp.stpacket.dapobjmerkleroot = '';
        tsp.stpacket.dapid = this._dapContract.dapcontract.meta.dapid;
        Schema.object.setID(tsp, this._dapContract.dapcontract.dapschema);
        let validTsp = Schema.validate.stpacket(tsp, this._dapContract.dapcontract.dapschema);
        if (validTsp.valid === false) {
            throw new Error('Invalid stpacket: ' + JSON.stringify(validTsp));
        }

        // create a transition
        let ts = Schema.create.stheader(tsp.stpacket.meta.id, this._currentUser.blockchainuser.uid);
        Schema.object.setID(ts);
        let validTs = Schema.validate.stheader(ts);
        if (validTs.valid === false) {
            throw new Error('Invalid header' + JSON.stringify(validTsp));
        }

        return this.DAPI.UpdateDapSpace(ts, tsp);
    }

    async sendPayment(username, amount, memo = null) {
        console.error('Received [Send Payment] message, threw it in the trash //TODO ' + memo, arguments);
    }

    /**
     * Request a payment.
     * @param {string} username - blockchain user who is asked to provide funds
     * @param {double} amount - amount being requested
     */
    async requestPayment(username, amount, memo = null) {
        console.error('Received [Request Payment] message, threw it in the trash //TODO ' + memo, arguments);
    }
}

module
    .exports = Client;
