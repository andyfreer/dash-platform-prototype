/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
/* eslint-disable */
let VMN = require('../../dash-vmn/index.js');
let Schema = require('../../lib/index.js');
let Bitcore = require('@dashevo/dashcore-lib');

/**
 * DashPay DAP Client
 *
 * For use in frontend applications (such as evo-contacts-list REACT website)
 */
class DashPayLib extends VMN.Client {

    /**
     *  ------------------------
     *  Events
     *  ------------------------
     */

    /**
     * Called from superclass constructor
     */
    onStart() {
        // array to hold combined contacts list processed from DapContext
        this._contactList = [];
    }

    /**
     * Eventhandler call when this user's DAPContext is updated in the super class.
     * DAPContext contains this user's own DapSpace plus objects
     * related to this user from other user's DapSpaces
     * Filter the user's DAP data into the DashPay views
     * @private
     */
    async onUpdate() {

        // process dapContext data into Contacts list
        // Note we derive state via correlation between matching objects related
        // between this and another user's DapSpace, to determine the contact status
        // from this user's perspective (approved, requested, etc).
        // In future we can move state definition / derivation into Schema definitions
        // but for now we have to do it manually for each DAP...
        if (this.dapContext) {

            let ownContactObjs = [];
            let relContactObjs = [];

            if (this.dapContext.objects) {

                // extract the own & related contact objects from the context
                ownContactObjs = this.dapContext.objects.filter((o) => {
                    return (o.objtype === "contact");
                });

            }
            if (this.dapContext.related) {
                relContactObjs = this.dapContext.related.filter((o) => {
                    return (o.objtype === "contact");
                });
            }

            // new array for combined contacts used in calling app
            let combContacts = [];

            // Extract sent Contact requests from DAP data to new list...
            for (let i = 0; i < ownContactObjs.length; i++) {

                let obj = ownContactObjs[i];

                let contactBu = await this.getUserById(obj.toUser.userId);

                let newContact = this._createContactObject(
                    contactBu.blockchainuser.uname,
                    contactBu.blockchainuser.uid,
                    'aboutMe',
                    'avatar',
                    this.getPayAddress(obj.hdextpubkey, i),     // crude derivation - improve to comply with DIP
                    true,
                    false);

                combContacts.push(newContact);
            }

            // Now extract received requests from other users
            for (let i = 0; i < relContactObjs.length; i++) {

                let obj = relContactObjs[i];
                let contactBu = await this.getUserById(obj.meta.uid);

                let matchedContacts = [];
                if (this.dapContext.objects) {
                    matchedContacts = this.dapContext.objects.filter((o) => {
                        return (o.objtype === "contact");
                    });
                }

                // 'accepted' status... both users sent contact requests to each other
                if (matchedContacts.length > 0) {

                    // update existing
                    for (let j = 0; j < combContacts.length; j++) {

                        if (combContacts[j].data.uid === contactBu.blockchainuser.uid) {
                            combContacts[j].type = 'approved';
                        }
                    }
                }
                // 'invited' status... this user received a request but didn't send one
                else {

                    let newContact = this._createContactObject(
                        contactBu.blockchainuser.uname,
                        contactBu.blockchainuser.uid,
                        'aboutMe',
                        'avatar',
                        this.getPayAddress(obj.hdextpubkey, i),
                        true,
                        false);

                    newContact.type = 'requested';

                    // create new object in the contacts array
                    combContacts.push(newContact);
                }
            }
            // main array used by contacts site
            this._contactList = combContacts;
        }

    }

    /**
     *  ------------------------
     *  Queries
     *  ------------------------
     */

    async searchUsers(pattern) {
        let objs = await super.searchUsers(pattern);

        // hack this for how the frontend is working (TODO: change frontend to native DAP object formats)
        return objs;
    }

    /**
     *  ------------------------
     *  Actions
     *  ------------------------
     */

    /**
     * Signup an existing Blockchain user to the DashPay DAP
     * (creates a signup object in the user's DAP space)
     * @param aboutme
     * @param avatar
     * @returns {*}
     */
    async signup(aboutme, avatar) {

        let obj = Schema.create.dapobject("user");
        obj.aboutme = aboutme;
        obj.avatar = avatar;
        return super._signup(obj);
    }

    async approveContactRequest(blockchainUsername) {

        // same as propose: just create a valid contact object referencing the target user as a relation
        return this.proposeContact(blockchainUsername);
    }

    async proposeContact(username) {

        let bu = await this.getUser(username);
        if (!bu) return null;

        let obj = Schema.create.dapobject("contact");

        // generate an HD public key for the user
        obj.hdextpubkey = new Bitcore.HDPrivateKey(this.testHelper.testUsers[0][1]).derive("m/1").hdPublicKey.toString();
        obj.toUser = {
            userId: bu.blockchainuser.uid,
        };

        // tsid
        return this.addObject(obj);
    }

    denyContactRequest(username) {

    }

    async removeContact(username) {
        let bu = await this.getUser(username);
        if (!bu) return null;

        let contacts = this.dapContext.objects.filter((o) => {
            if (o) {
                if (o.userId === bu.blockchainuser.uid) {
                    return true;
                }
            }
            return false;
        });

        if (contacts.length === 0) {
            return null;
        }

        let obj = contacts[0];
        obj.act = 3;
        obj.rev += 1;

        return this.removeObject(obj);
    }

    _createContactObject(uname, uid, aboutMe, avatar, payAddr, sent = false, received = false) {

        let state = this.DAPI.GetDapSpace(uid, this._dapContract.dapcontract.meta.dapid);

        // check for signup (profile) object in the user's dapspace and pull the profile info
        if (state) {
            if (state.objects) {
                avatar = state.objects[0].avatar;
                aboutMe = state.objects[0].aboutme;
            }
        }

        let obj = {
            data: {
                uname: uname,
                aboutMe: aboutMe,
                avatar: avatar,
                paymentAddress: payAddr,
                sent: sent,
                received: received,
                uid: uid,
            },
            type: 'proposed'
        };
        return obj;
    }

}

module.exports = DashPayLib;
