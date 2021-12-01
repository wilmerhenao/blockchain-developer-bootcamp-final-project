import React, { Component } from "react";
import Spanish21Contract from "./contracts/Spanish21.json";
import getWeb3 from "./getWeb3";

import "./App.css";

function changeBackground(e) {
    e.target.style.background = 'yellow';
}

class App extends Component {

    constructor(){
        super();
        this.onChange = this.onChange.bind(this)
        this.state = {metaAccount: null, game: null, potSize: '', web3: null, dealerHand: [], playerHand: [], splitHand: []};
    }

    onChange(e){
        const regex = /^[0-9\b]+$/;
        if (regex.test(e.target.value) || e.target.value === '') {
            this.setState({potSize: e.target.value})
        }
    }
    // Inserted in tree
    componentDidMount = async () => {
        try {
            const web3 = await getWeb3();

            var metaAccount = web3.currentProvider.selectedAddress;

            const networkId = await web3.eth.net.getId();
            const gameNetwork = Spanish21Contract.networks[networkId];
            const instanceFromABI = new web3.eth.Contract(
                Spanish21Contract.abi,
                gameNetwork && gameNetwork.address,
            );
            const responseGame = await instanceFromABI.methods.getGameState().call();
            this.setState({ web3, metaAccount, game: instanceFromABI, maxBet: responseGame.gameMaxBet });

        } catch (error) {
            // Catch any errors for any of the above operations.
            alert(
                `Failed to load.`,
            );
            console.error(error);
        }
    };

    render() {
        const myValues = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10]
        const cartaString = ["naipe/A-B.jpg", "naipe/2-B.jpg", "naipe/3-B.jpg", "naipe/4-B.jpg",
                            "naipe/5-B.jpg", "naipe/6-B.jpg", "naipe/7-B.jpg", "naipe/8-B.jpg",
                            "naipe/9-B.jpg", "naipe/S-B.jpg", "naipe/C-B.jpg", "naipe/R-B.jpg",
                            "naipe/A-C.jpg", "naipe/2-C.jpg", "naipe/3-C.jpg", "naipe/4-C.jpg",
                            "naipe/5-C.jpg", "naipe/6-C.jpg", "naipe/7-C.jpg", "naipe/8-C.jpg",
                            "naipe/9-C.jpg", "naipe/S-C.jpg", "naipe/C-C.jpg", "naipe/R-C.jpg",
                            "naipe/A-E.jpg", "naipe/2-E.jpg", "naipe/3-E.jpg", "naipe/4-E.jpg",
                            "naipe/5-E.jpg", "naipe/6-E.jpg", "naipe/7-E.jpg", "naipe/8-E.jpg",
                            "naipe/9-E.jpg", "naipe/S-E.jpg", "naipe/C-E.jpg", "naipe/R-E.jpg",
                            "naipe/A-O.jpg", "naipe/2-O.jpg", "naipe/3-O.jpg", "naipe/4-O.jpg",
                            "naipe/5-O.jpg", "naipe/6-O.jpg", "naipe/7-O.jpg", "naipe/8-O.jpg",
                            "naipe/9-O.jpg", "naipe/S-O.jpg", "naipe/C-O.jpg", "naipe/R-O.jpg"]
        const canSplit = this.state.playerHand.length === 2 &&
        (myValues[this.state.playerHand[0] % 12]) === (myValues[this.state.playerHand[1] % 12]) &&
              this.state.splitHand.length === 0 && 
              this.state.stage === "1";

        // The functions below will show either empty or will get filled with corresponding information to be rendered
        let splitButton;
        if (canSplit) {
            splitButton = <button onClick={this.split.bind(this)}>Split</button>;
        }

        const splitPlayerCards = this.state.splitHand.map(function(card,i){
            return <td align="center" border="20px" key={i}> <img src={cartaString[card % 48]} alt="Not Available" width="100" height="160"/> </td>;
        });
        
        const playSplitHand = this.state.splitHand.length > 0;
        let splitPlayerScore;
        let splitPlayerBet;

        if (this.state.splitHandScore > 21) {var splitHandStatus = " > 21";}
        if (playSplitHand) {
            splitPlayerScore = <td><i>Split Score: {this.state.splitHandScore}<b>{splitHandStatus}</b>&nbsp;&nbsp;&nbsp;&nbsp;</i></td>;
            splitPlayerBet = <td><i>Pot: {parseInt(this.state.splitBet) + parseInt(this.state.splitDoubleDownBet)} wei&nbsp;&nbsp;&nbsp;&nbsp;</i></td>;
        }

        let hitButton;
        if (this.state.stage === "1") {
            hitButton = <button onClick={this.hit.bind(this)}>Hit</button>;
        }

        let splitHitButton;
        if (this.state.stage === "2") {
            splitHitButton = <button onClick={this.hit.bind(this)}>Hit</button>;
        }

        const canDoubleDown = ((this.state.playerHand.length < 3) || (this.state.splitHand.length < 3));
        let doubleDownButton;
        if (canDoubleDown && this.state.stage === "1") {
            doubleDownButton = <button onClick={this.doubleDown.bind(this)}>Double</button>;
        }

        let splitDoubleDownButton;
        if (canDoubleDown && this.state.stage === "2") {
            splitDoubleDownButton = <button onClick={this.doubleDown.bind(this)}>Double</button>;
        }

        let standButton;
        if (this.state.stage === "1") {
            standButton = <button onClick={this.stand.bind(this)}>Stand</button>;
        }

        let splitStandButton;
        if (this.state.stage === "2") {
            splitStandButton = <button onClick={this.stand.bind(this)}>Stand</button>;
        }

        if (!this.state.web3) {
            return <div>Loading game components. Choose player 1 from your metamask account...</div>;
        }

        const croupierCards = this.state.dealerHand.map(function(card,i){
            return <td align="center" border="20px" key={i}> <img src={cartaString[card % 48]} alt="Banana!" width="100" height="160"/> </td>;
        });

        const playerCards = this.state.playerHand.map(function(card,i){
            return <td align="center" border="20px" key={i}> <img src={cartaString[card % 48]} alt="Banana!" width="100" height="160"/> </td>;
        });

        const playHand = this.state.playerHand.length > 0;

        if (this.state.handScore > 21) {var handStatus = " > 21";}
        if (this.state.dealerScore > 21) {var dealerStatus = " > 21";}

        let dealerScore;
        let playerScore;
        let playerBet;

        if (playHand) {
            dealerScore = <td><i>Croupier Score: {this.state.dealerScore}{dealerStatus}</i></td>;
            playerScore = <td><i>Player Score: {this.state.handScore}{handStatus}&nbsp;&nbsp;&nbsp;&nbsp;</i></td>;
            playerBet = <td><i>Pot: {parseInt(this.state.bet) + parseInt(this.state.doubleDownBet)} weis&nbsp;&nbsp;&nbsp;&nbsp;</i></td>;
        }

        let spanishBonus;
        if (this.state.handScore === 21 && this.state.playerHand.length  > 4){
            spanishBonus = <td><i> Spanish 21 Bonus unlocked! 5+ cards in a 21. </i></td>;
        }
        if (this.state.splitHandScore === 21 && this.state.splitHand.length > 4){
            spanishBonus = <td><i> Spanish 21 Bonus unlocked! 5+ cards in a 21. </i></td>;
        }
        // below you will get the html code to be displayed
        return (
                <div className="App" style={{ 
                    backgroundImage: `url("https://static.vecteezy.com/system/resources/previews/000/109/252/original/free-vector-casino-royale-background.jpg")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'yellow'
                  }}>

                <h1>SPANISH 21</h1>

                <h3>Croupier Cards:</h3>
                <table align="center"><tbody><tr>{dealerScore}</tr></tbody></table>
                <table align="center" style={{'font-size': "26px"}}><tbody><tr>{croupierCards}</tr></tbody></table>
                
                <table align="center"><tbody><tr>{spanishBonus}</tr></tbody></table>
                <h3>Player Cards:</h3>
                
                <table align="center"><tbody><tr>{playerScore}</tr></tbody></table>
                <table align="center" style={{'font-size': "26px"}}><tbody><tr>{playerCards}</tr></tbody></table>
                <table align="center"><tbody><tr>{playerBet}</tr></tbody></table>

            {hitButton}&nbsp;&nbsp;&nbsp;&nbsp;
            {standButton}&nbsp;&nbsp;&nbsp;&nbsp;
            {doubleDownButton}&nbsp;&nbsp;&nbsp;&nbsp;
            {splitButton}

                <table align="center"><tbody><tr>{splitPlayerScore}</tr></tbody></table>
                <table align="center" style={{'font-size': "26px"}}><tbody><tr>{splitPlayerCards}</tr></tbody></table>
                <table align="center"><tbody><tr>{splitPlayerBet}</tr></tbody></table>
            {splitHitButton}&nbsp;&nbsp;&nbsp;&nbsp;
            {splitStandButton}&nbsp;&nbsp;&nbsp;&nbsp;
            {splitDoubleDownButton}
            <hr style={{height: 1}}/>
            Blind Pot: <input value={this.state.potSize} onMouseOver={changeBackground} onChange={this.onChange} id="cajita"/> weis 
                <button onClick={this.newRound.bind(this)} onMouseOver={changeBackground}>New Game</button>
                
                <p/>
                <div> The Maximum Bet on this table is: {this.state.maximumBet} weis</div>
                <p>21 Pays 3:2 | 21 with 5 cards pays 3:2 | 21 with 6 cards pays 2:1 | 21 with 7+ cards pays 3:1 | Croupier Stands on Soft 17 | Double After Split | No Resplitting Allowed | No Insurance</p>
                <br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/><br/>     
            </div>
        );
    }

    newRound = async () => {
        const { metaAccount , game } = this.state;

        await game.methods.newRound().send({ from: metaAccount, value: this.state.potSize, gas: 500000 });

        const dCroupier = await game.methods.getDealerState().call();
        const dPlayer = await game.methods.getPlayerState().call();
        const responseGame = await game.methods.getGameState().call();

        this.setState({
            splitHand: dPlayer.splitHand,
            dealerScore: dCroupier.score,
            handScore: dPlayer.handScore,
            splitHandScore: dPlayer.splitHandScore,
            bet: dPlayer.bet,
            stage: responseGame.stage,
            maxBet: responseGame.gameMaxBet,
            dealerHand: dCroupier.hand,
            playerHand: dPlayer.hand,
            splitBet: dPlayer.splitBet,
            doubleDownBet: dPlayer.doubleDownBet,
            splitDoubleDownBet: dPlayer.splitDoubleDownBet
        });
    };

    split = async () => {
        const { metaAccount , game } = this.state;

        await game.methods.split().send({ from: metaAccount, value: this.state.potSize, gas: 500000 });

        const dCroupier = await game.methods.getDealerState().call();
        const dPlayer = await game.methods.getPlayerState().call();
        const responseGame = await game.methods.getGameState().call();

        this.setState({
            stage: responseGame.stage,
            dealerHand: dCroupier.hand,
            playerHand: dPlayer.hand,
            splitHand: dPlayer.splitHand,
            dealerScore: dCroupier.score,
            handScore: dPlayer.handScore,
            splitHandScore: dPlayer.splitHandScore,
            bet: dPlayer.bet,
            splitBet: dPlayer.splitBet,
            maxBet: responseGame.gameMaxBet,
            doubleDownBet: dPlayer.doubleDownBet,
            splitDoubleDownBet: dPlayer.splitDoubleDownBet
        });
    };

    stand = async () => {
        const { metaAccount , game } = this.state;

        await game.methods.stand().send({ from: metaAccount, gas: 500000 });

        const dCroupier = await game.methods.getDealerState().call();
        const dPlayer = await game.methods.getPlayerState().call();
        const responseGame = await game.methods.getGameState().call();

        this.setState({
            stage: responseGame.stage,
            maxBet: responseGame.gameMaxBet,
            dealerHand: dCroupier.hand,
            playerHand: dPlayer.hand,
            splitHand: dPlayer.splitHand,
            dealerScore: dCroupier.score,
            handScore: dPlayer.handScore,
            splitHandScore: dPlayer.splitHandScore,
            bet: dPlayer.bet,
            splitBet: dPlayer.splitBet,
            doubleDownBet: dPlayer.doubleDownBet,
            splitDoubleDownBet: dPlayer.splitDoubleDownBet
        });

    };

    doubleDown = async () => {
        const { metaAccount , game } = this.state;

        await game.methods.doubleDown().send({ from: metaAccount, value: this.state.potSize, gas: 500000 });

        const dCroupier = await game.methods.getDealerState().call();
        const dPlayer = await game.methods.getPlayerState().call();
        const responseGame = await game.methods.getGameState().call();

        this.setState({
            stage: responseGame.stage,
            maxBet: responseGame.gameMaxBet,
            handScore: dPlayer.handScore,
            splitHandScore: dPlayer.splitHandScore,
            bet: dPlayer.bet,
            splitBet: dPlayer.splitBet,
            doubleDownBet: dPlayer.doubleDownBet,
            splitDoubleDownBet: dPlayer.splitDoubleDownBet,
            dealerHand: dCroupier.hand,
            playerHand: dPlayer.hand,
            splitHand: dPlayer.splitHand,
            dealerScore: dCroupier.score
        });
    };

    hit = async () => {
        const { metaAccount , game } = this.state;

        await game.methods.hit().send({ from: metaAccount, gas: 500000 });

        const dCroupier = await game.methods.getDealerState().call();
        const dPlayer = await game.methods.getPlayerState().call();
        const responseGame = await game.methods.getGameState().call();

        this.setState({
            handScore: dPlayer.handScore,
            splitHandScore: dPlayer.splitHandScore,
            bet: dPlayer.bet,
            splitBet: dPlayer.splitBet,
            doubleDownBet: dPlayer.doubleDownBet,
            splitDoubleDownBet: dPlayer.splitDoubleDownBet,
            stage: responseGame.stage,
            maxBet: responseGame.gameMaxBet,
            dealerHand: dCroupier.hand,
            playerHand: dPlayer.hand,
            splitHand: dPlayer.splitHand,
            dealerScore: dCroupier.score
        });
    };
}

export default App;
