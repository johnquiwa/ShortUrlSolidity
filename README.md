# ShortUrlSolidity
* An implementation of a  Short Url service (REST API) using Node, Express, Solidity/Web3
* Compiles contract with `solc`
* Deployment is via Web3 (not using truffle)

## You will need
* Node v8 (utilizes async/await)
* Ganache or Ganache-cli (https://github.com/trufflesuite/ganache-cli)
* Postman to manually test

## To Run
* Install ganache-cli globally - `npm install -g ganache-cli`
* Install other dependencies in package.json - `npm install`
* Have testrpc running in one terminal window - `ganache-cli`
* In another terminal window run - `node deployContract`
* Run `node app`

## Endpoints - via `http://localhost:3000`
### POST '/' - (Returns Shortened Url Key)
* `http://localhost:3000/`
* Send a JSON payload with a url property (ex. `{ "url": "www.google.com"}`)
* This will return a url with the Shortened Url Key (ex. `http://localhost:3000/UtFhjsP8`)

### GET '/:shortenedUrlKey' - (Redirects to corresponding URL)
* Send a GET request with Shortened Url Key after slash
* If using the key from the URL from the POST endpoint - `http://localhost:3000/UtFhjsP8`

## Implementation
* Hashing an original url via sha256
* Encoding that hash to base64 and using the first 8 characters as the Shortened Url Key 
* (64^8 = 281,474,976,710,656 possible combinations)

## TODO
* Implement tests
