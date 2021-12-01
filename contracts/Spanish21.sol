// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.7.6;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";

// Parts of this contract were based on projects from previous years
contract Spanish21 is Ownable{
    using SafeMath for *;
    // @dev Types
    // @dev Stages betting stages, playing. Playing after splitting cards and ending the game.
    enum Stage {
                Bet, 
                PlayHand,
                PlaySplitHand,
                ConcludeHands
    }

    struct Player {
        uint256 bet;
        uint256 doubleDownBet;
        uint256 seed;
        uint8 score;
        uint256[] hand;
    }

    struct Game {
        uint256 id;
        uint64 startTime;
        uint64 round;
        Stage stage;
        Player dealer;
        Player player;
        Player splitPlayer;
    }

    // @Notice The first difference with blackjack is the values of cards and the numbers
    uint8[12] cardValues = [11, 2, 3, 4, 5, 6, 7, 8, 9, 10, 10, 10];
    mapping(address => Game) games;
    uint256 maximumBet;
    uint256 constant N_DECKS = 1;

    /// @dev Event declaration

    event StageChanged(uint256 gameId, uint64 round, Stage newStage);
    event NewRound(uint256 gameId, uint64 round, address player, uint256 bet);
    event CardDrawn(uint256 gameId, uint64 round, uint8 cardValue, uint8 score);
    event Result(uint256 gameId, uint64 round, uint256 payout, uint8 playerScore, uint8 dealerScore);
    event PlayerHand(uint256 gameId, uint256[] playerHand, uint256[] playerSplitHand);
    event Received(address, uint);

    // @dev Using time for randomness. This is a weakness of the contract.
    constructor() public {
    }

    // @dev the receive function takes generates a design pattern. Uses maximum Bet
    receive() external payable {
        emit Received(msg.sender, msg.value);
        maximumBet = SafeMath.div(address(this).balance, 100);
    }

    // @dev ownable - Access control design pattern
    function kill() public onlyOwner() {
        selfdestruct(address(uint160(owner())));
    }

    // @dev ensures that you are at the correct stage. Betting, playing, after split or ending game.
    modifier atStage(Stage _stage) {
        require(games[msg.sender].stage == _stage, "This function cannot be called this stage.");
        _;
    }

    // @dev when 2 stages are allowed (indiffirence between playing regular or split)
    modifier eitherStage(Stage _stage1, Stage _stage2) {
        require(games[msg.sender].stage == _stage1 || games[msg.sender].stage == _stage2,
                "This function cannot be called this stage.");
        _;
    }
    // @notice basic function that fetches the card and calculates the new score
    // @param game: The current Game structure that you're on
    // @param player: player or split parallel player
    function fetchCard(Game storage game, Player storage player) private {
        uint64 _now = uint64(block.timestamp);
        // This part below is dangerous and should include an oracle instead
        uint256 card = (player.seed + _now) % (N_DECKS*48); // 48 cards in spanish 21
        player.seed = uint256(keccak256(abi.encodePacked(player.seed, card, _now)));
        player.hand.push(card);
        player.score = recalculate(player);
        emit CardDrawn(game.id, game.round, cardValues[uint8(card % 12)], player.score);
    }

    // @notice Dealer draws card until he gets a value of 17. Or only draw one card
    // if the player is busted.
    // @return whether the dealer has a veintiuna (21)
    function drawDealerCards(Game storage game) private returns (bool) {
        if ( // player got busted
            (game.player.score > 21 && game.splitPlayer.hand.length == 0) ||
            (game.player.score > 21 && game.splitPlayer.score > 21)
            ) {
            fetchCard(game, game.dealer); 
            if (game.dealer.score == 21 && game.dealer.hand.length == 2) {
                return true;
            }
        } else {
            // Dealer keeps hitting until 17
            while (game.dealer.score < 17) {
                fetchCard(game, game.dealer);

                if (game.dealer.score == 21 && game.dealer.hand.length == 2) {
                    return true;
                }
            }
        }
    }

    // @param game structure
    function nextStage(Game storage game) internal {
        game.stage = Stage(uint(game.stage) + 1);

        if(game.stage == Stage.PlaySplitHand && game.splitPlayer.hand.length == 0) {
            game.stage = Stage(uint(game.stage) + 1);
        }

        emit StageChanged(game.id, game.round, game.stage);
    }

    // @notice Start a new game.
    // @dev design pattern maximum bet required here
    function newRound() public payable {
        require(msg.value <= maximumBet, "Bet must be less than maximum bet.");

        uint256 _seed;
        uint64 _now = uint64(block.timestamp);
        uint256 id = uint256(keccak256(abi.encodePacked(block.number, _now, _seed)));

        Player memory dealer;
        Player memory player;
        Player memory splitPlayer;

        games[msg.sender] = Game(id, _now, 0, Stage.Bet, dealer, player, splitPlayer);
        Game storage game = games[msg.sender];
        game.player.bet = msg.value;
        game.dealer.seed = ~_seed;
        game.player.seed = _seed;
        game.splitPlayer.seed = _seed;
        game.round++;

        emit NewRound(game.id, game.round, msg.sender, msg.value);

        dealCards(game);
        emit PlayerHand(game.id, game.player.hand, game.splitPlayer.hand);

        nextStage(game);
    }

    // @param the current game
    // @dev function that calculates value of the hands
    function recalculate(Player storage player) private view returns (uint8 score) {
        uint8 numberOfAces = 0;
        for (uint8 i = 0; i < player.hand.length; i++) {
            uint8 card = (uint8) (player.hand[i] % 12);
            score += cardValues[card];
            if (card == 0) numberOfAces++;
        }
        while (numberOfAces > 0 && score > 21) {
            score -= 10;
            numberOfAces--;
        }
    }

    // @notice This is where Spanish 21 is most different from a typical blackjack contract
    // @notice Payouts will depend on the score and the length of the "hand"
    function calculatePayout(Game storage game, Player storage player, bool dealerHas21) private view returns (uint256 payout) {
        Player memory dealer = game.dealer;

        if (player.score == 21 && player.hand.length == 2 && !dealerHas21) {
            payout = SafeMath.div(SafeMath.mul(player.bet, 5), 2); // 21 payout
        } else if (player.score == 21 && player.hand.length == 5 && !dealerHas21) {
            payout = SafeMath.div(SafeMath.mul(player.bet, 5), 2); // 21 bonus payout
        } else if (player.score == 21 && player.hand.length == 6 && !dealerHas21) {
            payout = SafeMath.mul(SafeMath.add(player.bet, player.doubleDownBet), 3); // 21 bonus payout with 6 cards
        } else if (player.score == 21 && player.hand.length > 6 && !dealerHas21) {
            payout = SafeMath.mul(SafeMath.add(player.bet, player.doubleDownBet), 4); // 21 bonus payout with 7+ cards
        } else if (player.score > dealer.score || dealer.score >= 21) {
            payout = SafeMath.mul(SafeMath.add(player.bet, player.doubleDownBet), 2);
        } else if (player.score == dealer.score) {
            payout = SafeMath.add(player.bet, player.doubleDownBet); // PUSH!
        } else {
            payout = 0; // Busted
        }
    }

    // @notice Initial deal of the cards
    function dealCards(Game storage game) private atStage(Stage.Bet) {
        fetchCard(game, game.player);
        fetchCard(game, game.player);
        fetchCard(game, game.dealer);
    }

    // @notice Function that handles splitting cards taking into account the requirements
    // @notice requirements of the game. Making sure to double the bet, and fetching the
    // @notice extra card
    // @dev requires that the player be in the playHand stage
    function split() public payable atStage(Stage.PlayHand) {

        Game storage game = games[msg.sender];

        require(msg.value == game.player.bet, "Must match original bet to split");
        require(game.player.hand.length == 2, "Can only split with two cards");
        require(game.splitPlayer.hand.length == 0, "Can only split once");
        require(cardValues[game.player.hand[0] % 12] == cardValues[game.player.hand[1] % 12],
                "First two cards must be same");
        game.splitPlayer.hand.push(game.player.hand[1]);
        game.player.hand.pop();

        fetchCard(game, game.player);
        fetchCard(game, game.splitPlayer);
        emit PlayerHand(game.id, game.player.hand, game.splitPlayer.hand);

        game.player.score = recalculate(game.player);
        game.splitPlayer.score = recalculate(game.splitPlayer);

        game.splitPlayer.bet = msg.value;
    }

    // @notice double down function. The player can be in regular or split play.
    // @notice fetches the card and ends play
    function doubleDown() public payable eitherStage(Stage.PlayHand, Stage.PlaySplitHand) {
        Game storage game = games[msg.sender];

        require(msg.value <= game.player.bet, "Bet cannot be greater than original bet");
        if (game.stage == Stage.PlayHand) {
            fetchCard(game, game.player);
            game.player.doubleDownBet = SafeMath.add(game.player.doubleDownBet, msg.value);
            game.player.score = recalculate(game.player);
        } else if (game.stage == Stage.PlaySplitHand) {
            fetchCard(game, game.splitPlayer);
            game.splitPlayer.doubleDownBet = SafeMath.add(game.splitPlayer.doubleDownBet, msg.value);
            game.splitPlayer.score = recalculate(game.splitPlayer);
        }
        nextStage(game);
        if(game.stage == Stage.ConcludeHands) {
            endGame(game);
        }
    }
    // @notice, fetches a new card and checks if player got busted
    function hit() public eitherStage(Stage.PlayHand, Stage.PlaySplitHand) {
        Game storage game = games[msg.sender];

        require(game.player.score < 21  && game.stage == Stage.PlayHand || (game.splitPlayer.score < 21 && game.stage == Stage.PlaySplitHand));

        if (game.stage == Stage.PlayHand) {

            fetchCard(game, game.player);
            game.player.score = recalculate(game.player);

            if (game.player.score >= 21) {
                nextStage(game);

                if (game.splitPlayer.hand.length == 0) {
                    endGame(game);
                }
            }

        } else {

            fetchCard(game, game.splitPlayer);
            game.splitPlayer.score = recalculate(game.splitPlayer);

            if (game.splitPlayer.score >= 21) {
                endGame(game);
            }
        }
    }
    
    // @notice Ends the game if necessary or continues to the dealer fetching cards
    function stand() public eitherStage(Stage.PlayHand, Stage.PlaySplitHand) {
        Game storage game = games[msg.sender];

        if((game.stage == Stage.PlayHand && game.splitPlayer.hand.length == 0)
           || game.stage == Stage.PlaySplitHand
           ) {
            nextStage(game);
            endGame(game);
        } else {
            nextStage(game);
        }
    }

    // @notice Handle payouts ensuring that the maximum bet is required
    function endGame(Game storage game) private{
        uint payout = 0;

        bool dealerHas21 = drawDealerCards(game);

        if (game.player.score <= 21) {
            payout = SafeMath.add(payout, calculatePayout(game, game.player, dealerHas21) );
        }

        if (game.splitPlayer.score <= 21) {
            payout = SafeMath.add(payout, calculatePayout(game, game.splitPlayer, dealerHas21) );
        }

        require(payout <= SafeMath.mul(game.player.bet, 8), "Dealer error - payout is too high."); // 2 hands * double down = 4 bets max

        if (payout != 0) {
            payable(msg.sender).transfer(payout); //make payable
        }

        maximumBet = SafeMath.div(address(this).balance, 100);
        emit Result(game.id, game.round, payout, game.player.score, game.dealer.score);
    }

    // @notice This is a getter function to return the croupier's hand
    // @return croupier's hand
    function getDealerState() public view returns (uint256[] memory hand, uint256 score) {
        Game storage game = games[msg.sender];
        hand = game.dealer.hand;
        score = game.dealer.score;
    }

    // @return Player's hands, pot values and scores.
    function getPlayerState() public view
        returns (
                 uint256[] memory hand,
                 uint256[] memory splitHand,
                 uint256 handScore,
                 uint256 splitHandScore,
                 uint256 bet,
                 uint256 splitBet,
                 uint256 doubleDownBet,
                 uint256 splitDoubleDownBet
                 )
    {
        Game storage game = games[msg.sender];
        hand = game.player.hand;
        splitHand = game.splitPlayer.hand;
        handScore = game.player.score;
        splitHandScore = game.splitPlayer.score;
        bet = game.player.bet;
        splitBet = game.splitPlayer.bet;
        doubleDownBet = game.player.doubleDownBet;
        splitDoubleDownBet = game.splitPlayer.doubleDownBet;
    }

    // @return selected values corresponding to the game
    function getGameState() public view
        returns (
                 uint256 gameId,
                 uint64 startTime,
                 uint256 gamemaximumBet,
                 uint64 round,
                 Stage stage
                 )
    {
        Game storage game = games[msg.sender];
        gameId = game.id;
        startTime = game.startTime;
        gamemaximumBet = maximumBet;
        round = game.round;
        stage = game.stage;
    }
    
    // @dev The fallback function
    fallback() external {}
}
