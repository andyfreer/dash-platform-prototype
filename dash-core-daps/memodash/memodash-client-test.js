/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */

'use strict';

const {expect, use} = require('chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');

use(dirtyChai);
use(chaiAsPromised);

const MemoDashClient = require('./memodash-client');
const VMN = require('../../dash-vmn/index.js');
const Schema = require('../../lib/index.js');
const data = require('./memodash-client-fixtures');
const dashMemoSchema = require('./memodash-schema');

const aliceName = data.alice_subtx_1.subtx.uname;
const bobName = data.bob_subtx_1.subtx.uname;

describe('MemoDash', () => {
    let aliceClient = null;
    let bobClient = null;

    before('Prepare DAPI clients', () => {
        VMN.Util.reset();
        aliceClient = new MemoDashClient();
        bobClient = new MemoDashClient();
    });

    before('Create Blockchain Users', () => {
        // Register Alice's Blockchain User
        aliceClient.DAPI.CreateUser(data.alice_subtx_1);
        aliceClient.DAPI.DashCore.mineBlock();
        let bu = aliceClient.DAPI.GetUserByName(data.alice_subtx_1.subtx.uname);
        let {valid} = Schema.validate.blockchainuser(bu);
        expect(valid).to.be.true();

        // Register Bob's Blockchain User
        bobClient.DAPI.CreateUser(data.bob_subtx_1);
        bobClient.DAPI.DashCore.mineBlock();
        bu = bobClient.DAPI.GetUserByName(data.bob_subtx_1.subtx.uname);
        ({valid} = Schema.validate.blockchainuser(bu));
        expect(valid).to.be.true();
    });

    before("Register Alice's DAP in the Platform DAP", async () => {
        await aliceClient.login(data.alice_subtx_1.subtx.uname);
        await bobClient.login(data.bob_subtx_1.subtx.uname);

        const dapid = await aliceClient.createDap(dashMemoSchema);
        const dapContract = await aliceClient.getDap(dapid);

        aliceClient.setDap(dapContract);
        bobClient.setDap(dapContract);

    });

    describe('Profile', function () {
        it('should be able to signup', async () => {
            await bobClient.signup({
                text: "I'm Bob",
                avatarUrl: 'https://ava.jpg',
                address: 'address',
                name: 'SuperBob'
            });
            await aliceClient.signup({name: 'Alice in wonderland',
                address: 'alicesaddress',
                text: 'hello',
                avatarUrl: 'http://ava.js'});
            const bobProfile = await bobClient.getUserProfileData(bobName);
            expect(bobProfile).to.exist();
            expect(bobProfile.name).to.be.equal('SuperBob');
            expect(bobProfile.address).to.be.equal('address');
            expect(bobProfile.text).to.be.equal("I'm Bob");
            expect(bobProfile.avatarUrl).to.be.equal('https://ava.jpg');
        });
        it('should not be able to signup twice', async () => {
            await bobClient.signup({
                text: "I'm Robert",
                avatarUrl: 'https://ava.jpg',
                address: 'address',
                name: 'SuperBob'
            });
            const bobSpace = await bobClient.getOwnDapSpace();
            const profiles = bobClient.filterObjectsByType(bobSpace, 'profile');
            expect(profiles.length).to.be.equal(1);
            expect(profiles[0].text).to.be.equal("I'm Bob");
        });
        it('should be able to update profile', async () => {
            let bobProfile = await bobClient.getUserProfileData(bobName);
            expect(bobProfile.name).to.be.equal('SuperBob');
            expect(bobProfile.address).to.be.equal('address');
            expect(bobProfile.text).to.be.equal("I'm Bob");
            expect(bobProfile.avatarUrl).to.be.equal('https://ava.jpg');
            await bobClient.updateProfile({
                text: "I'm Bob 2",
                avatarUrl: 'https://ava2.jpg',
                address: 'newshinyaddress',
                name: 'MegaBob'
            });
            bobProfile = await bobClient.getUserProfileData(bobName);
            expect(bobProfile.name).to.be.equal('MegaBob');
            expect(bobProfile.address).to.be.equal('newshinyaddress');
            expect(bobProfile.text).to.be.equal("I'm Bob 2");
            expect(bobProfile.avatarUrl).to.be.equal('https://ava2.jpg');
        });
        it('should be able to list profiles', async () => {
            let allProfiles = await bobClient.getAllProfiles();
            expect(allProfiles).to.exist();
            expect(allProfiles.length).to.be.equal(2);
            const aliceProfile = allProfiles.find(profile => profile.username === aliceName);
            const bobProfile = allProfiles.find(profile => profile.username === bobName);
            expect(aliceProfile).to.exist();
            expect(bobProfile).to.exist();

            expect(bobProfile.bio).to.be.equal("I'm Bob 2");
            expect(bobProfile.avatarUrl).to.be.equal('https://ava2.jpg');

            expect(aliceProfile.bio).to.be.equal('hello');
            expect(aliceProfile.avatarUrl).to.be.equal('http://ava.js');
        });
    });

    describe('Memo', function () {
        it('should be able to post memo', async () => {
            await bobClient.postMemo("It's my first memo!");
            const ownMemos = await bobClient.getAllOwnMemos();
            const memo = ownMemos.find(m => m.memoText === "It's my first memo!");
            expect(memo).to.exist();
            expect(memo.memoText).to.be.equal("It's my first memo!");
        });
        it("should be able to read other user's memo", async () => {
            await aliceClient.postMemo('Hello World from Alice!');
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);

            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');
            expect(memo).to.exist();
            expect(memo.memoText).to.be.equal('Hello World from Alice!');
        });
        it('should be able to edit memo', async () => {
            const ownMemos = await bobClient.getAllOwnMemos();
            let memo = ownMemos.find(m => m.memoText === "It's my first memo!");
            expect(memo).to.exist();
            expect(memo.memoText).to.be.equal("It's my first memo!");
            await bobClient.editMemo(memo.id, 'This memo is edited');
            memo = await bobClient.getMemo(memo.id);
            expect(memo.memoText).to.be.equal('This memo is edited');
        });
        it('should be able to list all memos', async () => {
            let allMemos = await bobClient.getMemos();
            expect(allMemos).to.exist();
            expect(allMemos.length).to.be.equal(2);
            const aliceMemo = allMemos.find(m => m.username === aliceName);
            const bobMemo = allMemos.find(m => m.username === bobName);
            expect(aliceMemo).to.exist();
            expect(bobMemo).to.exist();
            expect(bobMemo.memoText).to.be.equal('This memo is edited');
            expect(aliceMemo.memoText).to.be.equal('Hello World from Alice!');
        });
        it('should be able to delete memo', async () => {
            let ownMemos = await bobClient.getAllOwnMemos();
            let memo = ownMemos.find(m => m.memoText === 'This memo is edited');
            expect(memo).to.exist();
            expect(memo.memoText).to.be.equal('This memo is edited');
            await bobClient.deleteMemo(memo.id);
            ownMemos = await bobClient.getAllOwnMemos();
            memo = ownMemos.find(m => m.memoText === 'This memo is edited');
            expect(memo).not.to.exist();
        });
    });

    describe('MemoReply', function () {
        it('should reply to memo', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');
            expect(memo.memoRepliesCount).to.be.equal(0);

            await bobClient.replyToMemo(memo.id, 'Hello Alice!');

            const bobMemos = await bobClient.getAllOwnMemos();
            expect(bobMemos.length).to.be.equal(1);
            expect(bobMemos[0].memoText).to.be.equal('Hello Alice!');
        });
        it('should read replies to memo', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');

            const replies = await aliceClient.getMemoReplies(memo.id);
            expect(replies).to.exist();
            expect(replies.length).to.be.equal(1);
            expect(replies[0].username).to.be.equal(bobName);
            expect(replies[0].memoText).to.be.equal('Hello Alice!');
        });
        it('should delete reply to memo', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');

            let replies = await aliceClient.getMemoReplies(memo.id);
            expect(replies).to.exist();
            expect(replies.length).to.be.equal(1);
            expect(replies[0].username).to.be.equal(bobName);
            expect(replies[0].memoText).to.be.equal('Hello Alice!');

            await bobClient.deleteMemo(replies[0].id);

            replies = await aliceClient.getMemoReplies(memo.id);
            expect(replies.length).to.be.equal(0);
        });
    });

    describe('Like', function () {
        it('should like memo', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');
            expect(memo.memoLikesCount).to.be.equal(0);

            await bobClient.likeMemo(memo.id);

            const bobLikes = await bobClient.getAllOwnLikes();
            expect(bobLikes.length).to.be.equal(1);
            expect(bobLikes[0].relation.id).to.be.equal(memo.id);

            const aliceMemo = await aliceClient.getMemo(memo.id);
            expect(aliceMemo).to.exist();
            expect(aliceMemo.memoLikesCount).to.be.equal(1);
        });
        it('should not be able to like one memo twice', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');
            expect(memo.memoLikesCount).to.be.equal(1);

            await bobClient.likeMemo(memo.id);

            const bobLikes = await bobClient.getAllOwnLikes();
            expect(bobLikes.length).to.be.equal(1);
            expect(bobLikes[0].relation.id).to.be.equal(memo.id);

            const aliceMemo = await aliceClient.getMemo(memo.id);
            expect(aliceMemo).to.exist();
            expect(aliceMemo.memoLikesCount).to.be.equal(1);
        });
        it('should remove like', async () => {
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Hello World from Alice!');
            expect(memo.memoLikesCount).to.be.equal(1);

            const bobLikes = await bobClient.getAllOwnLikes();
            expect(bobLikes.length).to.be.equal(1);
            expect(bobLikes[0].relation.id).to.be.equal(memo.id);

            await bobClient.removeLike(bobLikes[0].id);

            const aliceMemo = await aliceClient.getMemo(memo.id);
            expect(aliceMemo).to.exist();
            expect(aliceMemo.memoLikesCount).to.be.equal(0);
        });
        it('should tip memo', async () => {
            await aliceClient.postMemo('Tip me please!');
            const aliceMemosAsBobSeesIt = await bobClient.getMemosByUsername(aliceName);
            const memo = aliceMemosAsBobSeesIt.find(m => m.memoText === 'Tip me please!');
            expect(memo.memoLikesCount).to.be.equal(0);
            expect(memo.memoTipTotal).to.be.equal(0);

            await bobClient.tipMemo(memo.id, 0.025);

            const bobLikes = await bobClient.getAllOwnLikes();
            expect(bobLikes.length).to.be.equal(1);
            expect(bobLikes[0].relation.id).to.be.equal(memo.id);

            const aliceMemo = await aliceClient.getMemo(memo.id);
            expect(aliceMemo).to.exist();
            expect(aliceMemo.memoLikesCount).to.be.equal(1);
            expect(aliceMemo.memoTipTotal).to.be.equal(0.025);
        });
    });

    describe('Follow', function () {
        it('should follow another user', async () => {
            let aliceProfile = await aliceClient.getOwnProfile();
            let bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile).to.exist();
            expect(aliceProfile.followersCount).to.be.equal(0);
            expect(bobProfile.followingCount).to.be.equal(0);

            await bobClient.followUser(aliceName);

            aliceProfile = await aliceClient.getOwnProfile();
            bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);
        });
        it("shouldn't follow user twice", async () => {
            let aliceProfile = await aliceClient.getOwnProfile();
            let bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile).to.exist();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);

            await bobClient.followUser(aliceName);

            aliceProfile = await aliceClient.getOwnProfile();
            bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);
        });
        it('should list user followers', async () => {
            let aliceProfile = await aliceClient.getOwnProfile();
            let bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile).to.exist();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);

            const followers = await bobClient.getUserFollowers(aliceName);
            expect(followers).to.exist();
            expect(followers.length).to.be.equal(1);
            expect(followers[0].username).to.be.equal(bobName);
        });
        it('should list users that you are following', async () => {
            let aliceProfile = await aliceClient.getOwnProfile();
            let bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile).to.exist();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);

            const following = await bobClient.getUserFollowing(bobName);
            expect(following).to.exist();
            expect(following.length).to.be.equal(1);
            expect(following[0].username).to.be.equal(aliceName);
        });
        it('should unfollow another user', async () => {
            let aliceProfile = await aliceClient.getOwnProfile();
            let bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile).to.exist();
            expect(aliceProfile.followersCount).to.be.equal(1);
            expect(bobProfile.followingCount).to.be.equal(1);

            await bobClient.unFollowUser(aliceName);

            aliceProfile = await aliceClient.getOwnProfile();
            bobProfile = await bobClient.getOwnProfile();
            expect(aliceProfile.followersCount).to.be.equal(0);
            expect(bobProfile.followingCount).to.be.equal(0);
        });
    });
});
