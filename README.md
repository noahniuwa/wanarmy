# Wanchain.guide Wan Army Backend

Hosted at: https://vast-stream-09242.herokuapp.com/

This is a simple back end API to be consumed by the wanchain.guide website. The backend consists of two parts. One part which updates information about the Wanchain blockchain every 10 minutes, and another part which consists of a single endpoint for querying about a specific address on the Wanchain blockchain.

## Updating information about the Wanchain blockchain:

It gets current information about the Wanchain blockchain through the two endpoints provided by the Wanchain team which provide information about all addresses on Wanchain with a balance and all addresses with a staking balance:

https://www.wanscan.org/api/wan/stakes

https://www.wanscan.org/api/wan/balances

The endpoints are hit and the responses are cached as JSON files every 10 minutes. It then calculates how many addresses fall into different ranks and caches the result as a JSON file. The result is available to be consumed by the front end at the root route (https://vast-stream-09242.herokuapp.com/).

This endpoint is consumed by the client at the page: https://wanchain.guide/wan-brigade

## Endpoint for checking rank of a single address

The API consists of a single route, '/getrank' which takes in a valid blockchain address from the Wanchain blockchain and calculates the amount of the WAN cryptocurrency associated with that address, and sends that informational to the client. The input box at https://wanchain.guide/wan-brigade is where users can input their Wanchain address. 

Feel free to test the API using any of the address at https://www.wanscan.org/.
