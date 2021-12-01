// SPDX-License-Identifier: GPL-3.0-or-later
let Spanish21 = artifacts.require('Spanish21')
let catchVuelta = require("./exceptionsHelpers.js").catchVuelta

contract('Spanish21', function(accounts) {

    const owner = accounts[0]
    const peter = accounts[1]

    let instance

    before(async () => {
        instance = await Spanish21.new()
        instance.send(web3.utils.toWei("10", "ether"))
    })

    /// check the beggining of the round
    it("should begin the game with only 3 cards on the table", async() => {
        await instance.newRound({from: peter, value: 10})
        const dealer = await instance.getDealerState({from: peter})
        const player = await instance.getPlayerState({from: peter})
        assert.equal(player.hand.length, 2, 'Player should have 2 cards')
        assert.equal(dealer.hand.length, 1, 'Dealer should have 1 card')
    })

    it("should double for the exact pot size", async() => {
        await instance.newRound({from: peter, value: 3})
        await instance.doubleDown({from: peter, value: 3})
    })

    it("should not be able to split after hitting", async() => {
        await instance.newRound({from: peter, value: 10})
        await instance.hit({from: peter})
        await catchVuelta(instance.split({from: peter}))
    })

    it("should not be able to split after standing", async() => {
        await instance.newRound({from: peter, value: 10})
        await instance.stand({from: peter})
        await catchVuelta(instance.split({from: peter}))

    })

    it("should not be able to double after busting", async() => {
        await instance.newRound({from: peter, value: 10})
        do {
            await instance.hit({from: peter})
            var player = await instance.getPlayerState({from: peter})
        } while(player.handScore < 21)

        await catchVuelta(instance.doubleDown({from: peter}))
    })

    it("should not be able to double after standing", async() => {
        await instance.newRound({from: peter, value: 10})
        await instance.stand({from: peter})
        await catchVuelta(instance.doubleDown({from: peter}))
    })
})
