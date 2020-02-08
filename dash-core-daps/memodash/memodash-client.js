/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';
let VMN = require('../../dash-vmn/index.js');
let Schema = require('../../lib/index.js');

// let Bitcore = require('@dashevo/dashcore-lib');

/**
 * MemoDash DAP Client
 * A https://memo.cash port as a Dash DAP for educational / demonstration purposes
 *
 * DAP Clients are embedded in a frontend webpage, app or backend server, to encapsulate all DAP access
 *
 * ...extends VMN.Client, aka SDK, which encapsulate DAP agnostic functions to the super class, can be swapped out with Production Client for testnet/mainnet
 *
 * ...check DashPay DAP Client as a reference...it has equiavlent of profiles and following but not memos :)
 */
class MemoDashClient extends VMN.Client {

    /**
     *  ------------------------
     *  Events
     *  (called from super class)
     *  ------------------------
     */

    onStart() {
        this.transactions = [];
    }

    async onUpdate() {

    }

    /**
     * Returns user id for the given username.
     * @param {string} username
     * @return {Promise<string>}
     */
    async getUserId(username) {
        const user = await this.getUser(username);
        if (!user) {
            throw new Error('No user was found');
        }
        return user.blockchainuser.uid;
    }

    /**
     * Return username by id
     * @param {string} userId
     * @return {Promise<string>}
     */
    async getUsername(userId) {
        const user = await this.getUserById(userId);
        if (!user) {
            throw new Error('No user was found');
        }
        return user.blockchainuser.uname;
    }

    getOwnUser() {
        if (this.checkAuth()) {
            return this._currentUser.blockchainuser;
        }
        throw new Error('Not authenticated');
    }

    async getDapSpace(username) {
        const isAuthenticated = this.checkAuth() && this.checkDap();
        if (isAuthenticated) {
            const userId = await this.getUserId(username);
            let dapId = this._dapContract.dapcontract.meta.dapid;
            const space = await this.DAPI.GetDapSpace(dapId, userId);
            if (!space) {
                throw new Error(`${username} Dap Space is not found`);
            }
            return space;
        }
        throw new Error('Not authenticated');
    }

    async getOwnDapSpace() {
        return this.getDapSpace(this.getOwnUser().uname);
    }

    async getDapContext(username) {
        const isAuthenticated = this.checkAuth() && this.checkDap();
        if (isAuthenticated) {
            const userId = await this.getUserId(username);
            let dapId = this._dapContract.dapcontract.meta.dapid;
            return await this.DAPI.GetDapContext(dapId, userId);
        }
    }

    /**
     * Get all Memos
     * @returns
     * [{
     *   username,
     *   memoDatetime,
     *   memoText,
     *   memoLikesCount,
     *   memoTipTotal,
     *   memoRepliesCount
     * }]
     */
    async getMemos() {
        const memosIds = await this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid)
            .filter(object => object.objtype === 'memo')
            .map(memo => memo.id);

        const memos = await Promise.all(memosIds.map(memoId => this.getMemo(memoId)));
        // flatten
        return [].concat.apply([], memos);
    }

    /**
     * @return {Promise<[]>}
     */
    async getAllProfiles() {
        const objects = await this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid, true);
        const unames = await Promise.all(objects.map(object => object.userId)
            .filter((userId, index, self) => self.indexOf(userId) === index)
            .map(userId => this.getUsername(userId)));
        return Promise.all(unames.map(uname => this.getUserProfile(uname)));
    }

    /**
     *  ------------------------
     *  Queries
     *  ------------------------
     */

    filterObjectsByType(objects, type) {
        return objects.filter(object => object.objtype === type);
    }

    /**
     * Get a user's profile info
     *
     * returns info for profile page on a MemoDash user
     * e.g. https://memo.cash/profile/19RyV6XQEww5td2LPWDpK8o5V8at7Vpwgv
     * @param username
     * @returns
     * {
     *   username,
     *   bio,
     *   avatarUrl,
     *   followersCount,
     *   followingCount,
     *   likesCount
     * }
     */
    async getUserProfile(username) {
        const {objects, related} = await this.getDapContext(username);
        let followers = [];
        const profileObjects = this.filterObjectsByType(objects, 'profile');
        const following = this.filterObjectsByType(objects, 'follow');
        const likes = this.filterObjectsByType(objects, 'like');
        if (related) {
            followers = this.filterObjectsByType(related, 'follow');
        }
        const [profile] = profileObjects;
        return {
            username,
            bio: profile.text,
            avatarUrl: profile.avatarUrl,
            followersCount: followers.length,
            followingCount: following.length,
            likesCount: likes.length
        };
    }

    async getOwnProfile() {
        return this.getUserProfile(this.getOwnUser().uname);
    }

    /**
     * Get a specific Memo
     * @param {string} id
     * @returns
     * Promise<{
     *   username,
     *   memoDatetime,
     *   memoText,
     *   memoLikesCount,
     *   memoTipTotal,
     *   memoRepliesCount
     * }>
     */
    async getMemo(id) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid, true);

        const {userId} = objects.find((objectWrapper) => {
            return objectWrapper.data.objtype === 'memo' && objectWrapper.data.id === id;
        });
        const username = await this.getUsername(userId);

        const memos = await this.getMemosByUsername(username);
        return memos.find(memo => memo.id === id);
    }

    /**
     * @param {string} username
     * @return {Promise<Array<{
     *   username,
     *   memoDatetime,
     *   memoText,
     *   memoLikesCount,
     *   memoTipTotal,
     *   memoRepliesCount
     * }>>}
     */
    async getMemosByUsername(username) {
        const {related, objects} = await this.getDapContext(username);
        const memos = this.filterObjectsByType(objects, 'memo');
        return memos.map(memo => {
            let [likes, replies] = [[], []];
            if (related) {
                likes = this.filterObjectsByType(related, 'like').filter(like => {
                    return like.relation.type === 'memo' && like.relation.id === memo.id;
                });
                replies = this.filterObjectsByType(related, 'memo').filter(reply => {
                    return reply.relation && reply.relation.type === 'memo' && reply.relation.id === memo.id;
                });
            }
            const tipTotal = likes.reduce((tips, like) => {
                let tipInThisLike = 0;
                if (like.tipTxHash) {
                    const tx = this.getTransaction(like.tipTxHash);
                    if (tx) {
                        tipInThisLike = tx.amount;
                    }
                }
                return tips + tipInThisLike;
            }, 0);

            return {
                username,
                id: memo.id,
                memoDatetime: memo.createdAt,
                memoText: memo.message,
                memoLikesCount: likes.length,
                memoTipTotal: tipTotal,
                memoRepliesCount: replies.length,
            };
        });
    }

    /**
     * Returns all own memos
     * @return {Promise<Array<{username, memoDatetime, memoText, memoLikesCount, memoTipTotal, memoRepliesCount}>>}
     */
    async getAllOwnMemos() {
        if (this.checkDap() && this.checkAuth()) {
            return this.getMemosByUsername(this.getOwnUser().uname);
        }
    }

    /**
     * Edit own memo at the given infex
     * @param {string} id
     * @param {string} newMessage
     * @return {Promise<boolean>}
     */
    async editMemo(id, newMessage) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid);
        const memo = objects.find((object) => object.objtype === 'memo' && object.id === id);

        if (!memo) {
            throw new Error(`Couldn't find memo ${id}`);
        }

        memo.message = newMessage;
        memo.updatedAt = new Date().toISOString();

        return this.updateObject(memo);
    }

    /**
     * Removes memo context
     * @param {string} id
     * @return {Promise<boolean>}
     */
    async deleteMemo(id) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid);
        const memo = objects.find((object) => object.objtype === 'memo' && object.id === id);

        if (!memo) {
            throw new Error(`Couldn't find memo at index ${id}`);
        }
        memo.updatedAt = new Date().toISOString();
        return this.removeObject(memo);
    }

    /**
     * Get Memos that reply to a given Memo
     * @returns
     * [{
     *   username,
     *   memoDatetime,
     *   memoText,
     *   memoLikesCount,
     *   memoTipTotal,
     *   memoRepliesCount
     * }]
     */
    async getMemoReplies(id) {
        const objects = await this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid);
        let replies = [];
        if (objects) {
            replies = Promise.all(this
                .filterObjectsByType(objects, 'memo')
                .filter(reply => {
                    return reply.relation && reply.relation.type === 'memo' && reply.relation.id === id;
                })
                .map(reply => {
                    return this.getMemo(reply.id);
                }));
        }
        return replies;
    }

    /**
     *  ------------------------
     *  Actions
     *  ------------------------
     */

    /**
     * @private
     * @param username
     * @return {Promise<{type: string, allOf: {$ref: string}[], properties: {bio: {type: string}}}|profile|{type, isprofile, allOf, properties}|((reportName?: string) => void)|string>}
     */
    async getUserProfileData(username) {
        const objects = await this.getDapSpace(username);
        return this.filterObjectsByType(objects, 'profile')[0];
    }

    /**
     * Create memo dash profile
     * @param profileData
     * @param {string} profileData.text
     * @param {string} profileData.avatarUrl
     * @param {string} profileData.address
     * @param {string} profileData.name
     * @return {Promise<*>}
     */
    async signup(profileData) {
        let profile = Schema.create.dapobject('profile');

        Object.assign(profile, profileData);

        return super._signup(profile);
    }

    /**
     * Update memo dash profile
     * @param newProfileData
     * @param {string} [newProfileData.text]
     * @param {string} [newProfileData.avatarUrl]
     * @param {string} [newProfileData.address]
     * @param {string} [newProfileData.name]
     * @return {Promise<boolean>}
     */
    async updateProfile(newProfileData) {
        if (this.checkAuth() && this.checkDap()) {
            const objects = await this.getDapSpace(this._currentUser.blockchainuser.uname);
            const profile = this.filterObjectsByType(objects, 'profile')[0];

            Object.assign(profile, newProfileData);

            return this.updateObject(profile);
        }
        throw new Error('Not authenticated');
    }

    /**
     * Post memo to your profile.
     * @param {string} message
     * @return {Promise<boolean>}
     */
    async postMemo(message) {
        const memo = Schema.create.dapobject('memo');
        memo.message = message;
        memo.createdAt = new Date().toISOString();
        return this.addObject(memo);
    }

    /**
     * Follow a user
     * @param {string} username
     * @return {Promise<boolean>}
     */
    async followUser(username) {
        const userId = await this.getUserId(username);

        const follow = Schema.create.dapobject('follow');
        follow.relation = {userId};

        return this.addObject(follow);
    }

    /**
     * Get followers of a user
     * @returns
     * [{
     *   username
     * }]
     */
    async getUserFollowers(username) {
        const {related} = await this.getDapContext(username);
        if (related) {
            return this
                .filterObjectsByType(related, 'follow')
                .map(follower => ({username: follower.meta.uname}));
        }
        return [];
    }

    /**
     * Get users followed by a user
     * @returns
     * [{
     *   username
     * }]
     */
    async getUserFollowing(username) {
        const objects = await this.getDapSpace(username);
        const usernames = await Promise.all(this
            .filterObjectsByType(objects, 'follow')
            .map(follower => this.getUsername(follower.relation.userId)));
        return usernames.map(u => ({username: u}));
    }

    /**
     * Unfollow user
     * @param {string} username
     * @return {Promise<boolean>}
     */
    async unFollowUser(username) {
        let userId = await this.getUserId(username);
        const objects = await this.getDapSpace(this.getOwnUser().uname);
        const following = this.filterObjectsByType(objects, 'follow');
        const follow = following.find(f => {
            return f.relation.userId === userId;
        });
        if (!follow) {
            return true;
        }
        return this.removeObject(follow);
    }

    async replyToMemo(id, message) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid, true);
        const {userId} = objects.find((objectWrapper) => {
            return objectWrapper.data.objtype === 'memo' && objectWrapper.data.id === id;
        });

        const memo = Schema.create.dapobject('memo');
        memo.message = message;
        memo.createdAt = new Date().toISOString();
        memo.relation = {
            userId,
            id,
            type: 'memo'
        };

        return this.addObject(memo);
    }

    /**
     * Like memo
     * @param {string} id - memo id
     * @return {Promise<*>}
     */
    async likeMemo(id) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid, true);
        const {userId} = objects.find((objectWrapper) => {
            return objectWrapper.data.objtype === 'memo' && objectWrapper.data.id === id;
        });

        const like = Schema.create.dapobject('like');
        like.relation = {
            userId,
            id,
            type: 'memo',
        };

        return this.addObject(like);
    }

    async getAllOwnLikes() {
        const objects = await this.getDapSpace(this.getOwnUser().uname);
        return this.filterObjectsByType(objects, 'like');
    }

    /**
     * Remove like from memo
     * @param {string} id - like id
     * @return {Promise<void>}
     */
    async removeLike(id) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid);
        const like = objects.find((objectWrapper) => {
            return objectWrapper.objtype === 'like' && objectWrapper.id === id;
        });
        if (!like) {
            throw new Error(`Couldn't find like at index ${id}`);
        }
        like.updatedAt = new Date().toISOString();
        return this.removeObject(like);
    }

    sendTransaction(to, amount) {
        const transaction = {
            to,
            amount,
            timestamp: Date.now()
        };
        const hash = Schema.util.hash.toHash(transaction);
        transaction.hash = hash;
        this.DAPI.DashCore.db.insertToCollection('memotransactions', transaction);
        return hash;
    }

    getTransaction(hash) {
        return this.DAPI.DashCore.db.findInCollection('memotransactions', {hash});
    }

    async tipMemo(id, amount) {
        const objects = this.DAPI.getDapData(this._dapContract.dapcontract.meta.dapid, true);
        const {userId} = objects.find((objectWrapper) => {
            return objectWrapper.data.objtype === 'memo' && objectWrapper.data.id === id;
        });
        const profile = objects.find((objectWrapper) => {
            return objectWrapper.data.objtype === 'profile' && objectWrapper.userId === userId;
        });

        const like = Schema.create.dapobject('like');
        like.relation = {
            userId,
            id,
            type: 'memo',
        };

        like.tipTxHash = await this.sendTransaction(profile.address, amount);

        return this.addObject(like);
    }

    /**
     *  ------------------------
     *  Not required (from memo.cash)
     *  ------------------------
     *
     *  Set image base URL
     *  Attach picture
     *  Set profile picture
     *  Repost memo
     *  Post topic message
     *
     */
}

module.exports = MemoDashClient;
