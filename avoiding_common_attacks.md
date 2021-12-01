# Avoiding common attacks

These are some of the steps taken

## Integer overflow & underflow

Using safemath against integer overflow and underflow. Another way to tackle this problem would have been using a compiler > 8.0.0

## Fetching the cards

There is a strict ordering of the different cycles during the game. Betting, then play, then split, then end. No jumping is allowed

## Weakness

It uses timestamp to draw the cards which is easily exploited. I didn't have a chance to implement an oracle solution such as chainlink. Here's how this problem could be exploited: https://www.youtube.com/watch?v=u_qlgw2G5wM&ab_channel=SmartContractProgrammer