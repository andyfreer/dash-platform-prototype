/**
 * Copyright (c) 2017-present, Dash Core Team
 *
 * This source code is licensed under the MIT license found in the
 * COPYING file in the root directory of this source tree.
 */


'use strict';
//let Schema = require('../../../lib/index.js');
let Daps = require('../../../dash-core-daps/index.js');
/**
 * Auto creation of test-env initial data for VMN
 *
 *  @private
 */
class TestHelper {

    constructor(Client) {

        this.Client = Client;

        // test users (baked in from Faker)
        this.testUsers = [
            ['alice.vonrueden24', 'xprv9s21ZrQH143K3LN5UuknCtEzzyNXYsdRvbJAed8wtZYQeAwPQoe5NmdG4YJ2GgJivth8X1xvVA5LcXbRMUWxqExFgJBPNXjTwRNx5Zjt4WT'],
            ['bob.q14', 'xprv9s21ZrQH143K3yR9AMKQ7mcUwcSQ95d5WgUEFnN13Hoca7LVnGaHfADbWFgwTS1NAHP1pM42DbZRt22MWZWEDEkohfHa8QiB6TzGSAoVXPK'],
            ['charlie_breitenberg', 'xprv9s21ZrQH143K2TQtm7aZ9U3i7Zk7hD65MCYk74zSmYPmEjGna3DYD7TuWQxV2DpE9kb8pHTHiZjro3dqLevztW5m4FnheSAmmahQ2GqFP4G'],
            ['delaney33', 'xprv9s21ZrQH143K3EDi7RLWumavbxnjVs5eDEnYpjcJJ9n6hkfosLKgFCz8ECqmj87P5Jyh3EQpB2uSDrfcL1bSF2rKta8kfG68v56ET3H8Tgv'],
            ['ella_blick', 'xprv9s21ZrQH143K2sLmoVHXJGf1WYwwGDgF6JNt26nWnHFm96ct833ja7YZeYDThkSL68ZvxXypMgCpiL2GhH6ncCNaGDzTkeogUPr4LtUZLRM'],
            ['freeman_schneider30', 'xprv9s21ZrQH143K2QMgWeWTDTxzbhpd1gUvPWADaLFAAbKqrDebN4Au5fFEKG3atexiA5U6Xw6qsKhE6EBVPNirNEv115rKbgKQUW1WEmX6xpu'],
            ['garth_reynolds', 'xprv9s21ZrQH143K2FjTx3fKw86HuoyTefaGLHobGHr4vkLsoiVSSHHo5yDDHGakABpU5Zj3oJuEz5BCPPRhKVdW3FM9wCXtbn81AjhyurDqK34'],
            ['heber_marks21', 'xprv9s21ZrQH143K2jngB8dhG5f4mfVimd9YMt6kKh35beWD7MtNQvKExaMADZRE8mjdJvrWoqjwnmRX3LUUgKmW9jMvJMeD7u3GNJJJr8EhdKb'],
            ['indiana_77', 'xprv9s21ZrQH143K2Uzd64NVmLyThjDpg4JZubADsh6nP84VRKGdCka57eHYrgfdtHQzEarBKQ5jBirMLnrFQ2DzKDZqmEnSty5LPN1hUc1our7'],
            ['jaiden_gleason14', 'xprv9s21ZrQH143K2GfP6swYNhWTcDGV7dQroGk69c3Zmn5FJiUmRr2xb1fsKtNBFKWzBDk5VYGG8WQbjxiXscCQoLDz9h3tZpMwVu2BgKv9pF4'],
            ['kariane46', 'xprv9s21ZrQH143K3k24dLw9MJzxh4G9r2pzo2RZFZCTLaSdR6MGkf7pKQSsWTMkkc792UJFe8revLnLkwraeeKSHyRksfmBWhrQaQUq7QWh5yX'],
            ['ludie_sauer13', 'xprv9s21ZrQH143K33tZJR92pxuvWps4u6w16cF77wK54ushzRyojift8FFyqDTsY4FRWLzc1bxQwy7gQnm9DJDD2ZjbHkszxhBSqi2wZqj5fn1'],
            ['margot67', 'xprv9s21ZrQH143K2LFnCKD5WRGtYTrvptVu4TXtgE21neTUQa1oCjaGF9myXU4spckosWTbP63mEYXEbGEy8MG2PAwsNtvpBfaE2s4Rx2f4i4g'],
            ['nigel.reichert57', 'xprv9s21ZrQH143K39Tc96CPSLEUX3mfCTDje2GySPFPPzCPDCiSEfyH15C6vaS1YTtjf4gmX9EYxRfNxQrkakSRX7dd2gByCw2ANpYRpNmS2ba'],
            ['oscarkuvalis32', 'xprv9s21ZrQH143K43hnWKSV345p3b54H8imaP5diMViRsYCGm9JApSL2ffsjbLM8Agihe6qQ7UPH7k3BD6Dfba4BzMqHVHMpFvq7QSxYhJN7jx'],
            ['pascale.dibbert', 'xprv9s21ZrQH143K48M7Mk58C2uqe2JtLdRaR2oeAcGWmSvVSrRPTa9js49HpZRJHb2yx3QmbP1AdZRdwLMiFL9xYwcbZJnWxaz5wgPgeWuvTSR'],
            ['quentin.patel55', 'xprv9s21ZrQH143K32cPau4JMMp6LQEsszegjg6K3kFPgTfFsb18NkJU4HthVwnz42FiGpiw4d6Wmo4v6jgnAub9U1oC679nLwFT3UmprbhFhdi'],
            ['reinhold_harvey', 'xprv9s21ZrQH143K4Li3xD6beHm3rHzEiyDYopzbifNA1gAobytWTUg4dNiMGNfbHZiLs2pZKYA9neybYaXrQqfx6wJnX6bTrFYwVK1vc4R5FRR'],
            ['susan21', 'xprv9s21ZrQH143K39EZcdEQSgMD2fDKx2BAYGXmKMuX5zc6rbMh5g8bpc82mcg4kqqUxitJQ3tiDzb2uAcXLXRkHmkskxqrgqD9FYDaWrgqubL'],
            ['taurean74', 'xprv9s21ZrQH143K2wJogx58zUH5jp9vzpSrW1tWL9ZAHWCsr8oixMDqi9oq5bEbb58fACAcYAFuzbaR9ns7gcJXQtNErqn7iAbtyF3kMziuJqG'],
            ['ursula_le1', 'xprv9s21ZrQH143K3rJxGz1TAcwS2HYKEwGozgzmU8vmegy1tmHbBgSkAiyHV1xA3hqEJLh6Dqisq7jL8zpQZmHWfHTiY9BJCgctvYHcBtFEzVs'],
            ['victor.schmitt', 'xprv9s21ZrQH143K33nvRLAHyMSrWQYK4ZFqTv46zELr6ko5YtTpjF8ta8tioi4YUQmBpT1q7Um23gZ3hKmrAhFWpPWC6TGUhBAbqUWRmiC7eaM'],
            ['wanda.lubowitz', 'xprv9s21ZrQH143K4WJDtvVXUXRpr5KQ6P3sG5pizv4TWHxQdPEJb38Qxdxa497rGsuTZrG7r9Q9Y8Jdy4moHtB7WtwiPH8n44byrffmzHK6vPg'],
            ['xavier_mccullough3', 'xprv9s21ZrQH143K3RfW9asgC9c8kQ5AewhcnWgigty9eXvZV9ubQTCts8axWeibC41ALZbqPifzVuqxvKUZnBsavV3oz8XqXepk1knvqe6mmxM'],
            ['yolanda24', 'xprv9s21ZrQH143K2N3PVCwkBZHs5LXbYfumhvbX2Mqdqvks1qHjopWZS2Kr538PN4Kg3T6kRhg23LobTMPRFNAxryGvcGA96Ji8ewyDU3XiWnX'],
            ['zen.yundt98', 'xprv9s21ZrQH143K3kTmKSh5F1d4TMPGAP3a5gNmEScmJdSo8KUf4vUwvbnJaQrenqcchocKrK6JG54LyCB7f3MJic2T3ArTo4wzriVk1eKvQKu']
        ];

        this.dashPaySignupInfo = [

            ['Sunt quis numquam voluptates corrupti iusto perfer…a maxime ullam ut molestias sed aspernatur atque.', 'https://s3.amazonaws.com/uifaces/faces/twitter/bryan_topham/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/d33pthought/128.jpg'],
            ['Itaque assumenda officia eaque omnis beatae ipsam …t dignissimos. Soluta enim in non animi nihil id.', 'https://s3.amazonaws.com/uifaces/faces/twitter/adamawesomeface/128.jpg'],
            ['Debitis enim ut et ipsam', 'https://s3.amazonaws.com/uifaces/faces/twitter/bungiwan/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/thehacker/128.jpg'],
            ['Magnam quisquam repudiandae a. Excepturi molestiae…suscipit delectus aliquid. Veritatis in sunt aut.', 'https://s3.amazonaws.com/uifaces/faces/twitter/pixage/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/matbeedotcom/128.jpg'],
            ['Laudantium iusto qui unde.', 'https://s3.amazonaws.com/uifaces/faces/twitter/bobbytwoshoes/128.jpg'],
            ['Laboriosam voluptatum enim enim.', 'https://s3.amazonaws.com/uifaces/faces/twitter/nicollerich/128.jpg'],
            ['Et necessitatibus qui consequuntur placeat ex alia…tur illo. Debitis enim ut et ipsam odio sunt qui.', 'https://s3.amazonaws.com/uifaces/faces/twitter/umurgdk/128.jpg'],
            ['Asperiores fugit odit harum ut voluptatibus. A eaq…to. Illum necessitatibus dolor voluptatum magnam.', 'https://s3.amazonaws.com/uifaces/faces/twitter/osvaldas/128.jpg'],
            ['Aliquam iure aut sint est voluptas dolorem esse fuga sapiente.', 'https://s3.amazonaws.com/uifaces/faces/twitter/looneydoodle/128.jpg'],
            ['Sed et excepturi autem expedita repudiandae iusto.…e iste aut et sed. Corrupti ea quo harum commodi.', 'https://s3.amazonaws.com/uifaces/faces/twitter/nwdsha/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/sbtransparent/128.jpg'],
            ['Consequatur consectetur repudiandae voluptatem exercitationem libero laudantium ut.', 'https://s3.amazonaws.com/uifaces/faces/twitter/darcystonge/128.jpg'],
            ['Odio dolor porro aliquid in. Ratione vitae volupta…iquid dolores alias nam. Sed adipisci et aperiam.', 'https://s3.amazonaws.com/uifaces/faces/twitter/katiemdaly/128.jpg'],
            ['Aut magni quia culpa doloribus consectetur delectu…loremque sunt earum. Soluta quae ut voluptas aut.', 'https://s3.amazonaws.com/uifaces/faces/twitter/h1brd/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/jjsiii/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/gavr1l0/128.jpg'],
            ['Aut libero cum similique ut. Officiis atque ipsum … tempore. Debitis voluptatem aliquam nam laborum.', 'https://s3.amazonaws.com/uifaces/faces/twitter/codysanfilippo/128.jpg'],
            ['', 'https://s3.amazonaws.com/uifaces/faces/twitter/markwienands/128.jpg'],
            ['Sed temporibus rerum.', 'https://s3.amazonaws.com/uifaces/faces/twitter/harry_sistalam/128.jpg'],
            ['Officiis ut optio nihil iste reiciendis vitae. Quo soluta doloribus iusto error.', 'https://s3.amazonaws.com/uifaces/faces/twitter/dawidwu/128.jpg'],
            ['Sed cum quos quasi. Omnis expedita aut fugiat maxi…tibus quaerat ut. Quam at a. Quis nobis ad dolor.', 'https://s3.amazonaws.com/uifaces/faces/twitter/missaaamy/128.jpg'],
            ['Ut minima cumque rerum alias unde tempora hic consectetur.', 'https://s3.amazonaws.com/uifaces/faces/twitter/horaciobella/128.jpg'],
            ['Et accusamus debitis. Eum ut soluta voluptatum. Si…accusantium voluptatem explicabo similique ut ex.', 'https://s3.amazonaws.com/uifaces/faces/twitter/teylorfeliz/128.jpg']
        ];
    }

    async GenTestData(numTestUsers = 0) {
        let dapid = null;

        let o = await this.Client.searchDaps('DashPay');
        if (o.length > 0) {
            return this.Client.getDap(o[0].dapcontract.meta.dapid);
        }

        try {

            let dapContract = null;

            if (numTestUsers === 0) {
                return;
            } else if (numTestUsers > this.testUsers.length - 1) {
                numTestUsers = this.testUsers.length - 1;
            }

            // create & send subtx for each user
            // TODO: batch subtx to single block
            for (let i = 0; i < numTestUsers; i++) {

                let uname = this.testUsers[i][0];
                let prvKey = this.testUsers[i][1];

                // Create blockchain user & login to the Client
                await this.Client.createBlockchainUser(uname, prvKey);
                await this.Client.login(uname, prvKey);

                // First user create's DAP contract and loads it
                if (i === 0) {
                    dapid = await this.Client.createDap(Daps.DashPay);
                    dapContract = await this.Client.getDap(dapid);
                    this.Client.setDap(dapContract);
                }

                let aboutme = this.dashPaySignupInfo[i][0];
                let avatar = this.dashPaySignupInfo[i][1];

                // Signup to the DashPay DAP space
                await this.Client.signup(aboutme, avatar);

                this.Client.logout();

                this.Client.log('generated test data');
            }
        } catch (e) {
            let m = 'error generating test data';
            this.Client.log(m, e);
            throw new Error(e);
        }
        return this.Client.getDap(dapid);
    }
}

module.exports = TestHelper;
