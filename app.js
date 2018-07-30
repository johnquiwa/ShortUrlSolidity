// Express + Node Modules
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const crypto = require('crypto');

// Read And Compile Solidity Contract
const fs = require('fs');
const input = fs.readFileSync('contracts/ShortenUrl.sol', 'utf8');
const solc = require('solc');
const output = solc.compile(input, 1);
const abi = JSON.parse(output.contracts[':ShortenUrl'].interface);

// Web3
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');

// Config file provides deployed contract address
const config = require('./config.json');

// Get ShortenUrlContract instance via web3
const ShortenUrlContractInstance = new web3.eth.Contract(abi, config.contractAddress);

// Create async function
// async/await allows for more readable code
const getOwnerAccount = async () => {
  return web3.eth.getAccounts().then((accounts) => {
    return accounts[0];
  })
  .catch((err) => {
    console.error(new Error(err));
  })
};

// Returns an object with the base64Key it's corresponding hex
// Checks to see if the key already exists in contract storage
// If it does, recursively calls itself with random num appended to original Url
const createShortUrl = async (originalUrl) => {
  const sha256 = crypto.createHash('sha256');
  const ownerAccount = await getOwnerAccount();

  try {
    // Hash the original URL
    // Convert the hash to base64 ([a-z], [A-Z], [0-9], +, /)
    const hash = sha256.update(originalUrl).digest('base64');

    // This is the  base64 key that corresponds to the given URL
    const base64Key = hash.slice(0, 8);

    // Convert base64 to hex string
    // (Solidity Contract is expecting bytes8)
    let shortUrlKey = `0x${Buffer.from(base64Key, 'base64').toString('hex')}`;

    // Check for collision
    const longUrl = await ShortenUrlContractInstance.methods.getMatchedUrl(shortUrlKey).call({from: ownerAccount});
    if (longUrl) {
      const randomNum = Math.random();
      return createShortUrl(`${originalUrl}${randomNum}`);
    }

    return {
      base64Key,
      shortUrlKey:`0x${Buffer.from(base64Key, 'base64').toString('hex')}`
    }
  } catch(err) {
    console.error(err);
  }
};

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * GET '/'
 * Health check
 */
app.get('/', (req, res) => {
  res.sendStatus(200);
});

/**
 * POST '/'
 * Endpoint to create a a shortened Url
 * Updates storage of Solidity Contract
 */
app.post('/', async (req, res) => {
  const ownerAccount = await getOwnerAccount();
  const originalUrl = req.body.url;

  if (!req.body.url) {
    res.status(500).send('ERROR: No url parameter provided');
  }

  const { shortUrlKey, base64Key } = await createShortUrl(originalUrl);

  // Convert the original url to hex
  // (Solidity Contract is expecting bytes of undetermined length)
  const originalUrlInBytes = `0x${Buffer.from(originalUrl, 'utf8').toString('hex')}`;

  try {
    await ShortenUrlContractInstance.methods
      .createShortenedUrl(shortUrlKey, originalUrlInBytes)
      .send({from: ownerAccount, gas: 1000000});

    res.status(200).send({shortUrlKey: `http://localhost:3000/${base64Key}`});
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});

/**
 * GET '/:shortUrl'
 * Endpoint to retrieve the longUrl for a corresponding shortUrl
 * Redirects upon finding match from Solidity Contract
 */
app.get('/:shortUrl', async (req, res) => {
  const ownerAccount = await getOwnerAccount();
  const shortUrlKey = `0x${Buffer.from(req.params.shortUrl, 'base64').toString('hex')}`;

  try {
    const longUrl = await ShortenUrlContractInstance.methods.getMatchedUrl(shortUrlKey).call({from: ownerAccount});
    const redirectUrl = Buffer.from(longUrl.slice(2), 'hex').toString('utf8');

    res.redirect(redirectUrl);
  } catch(err) {
    res.status(500).send(err);
  }
});

app.listen(3000, () => console.log('Shorten Url is listening on port 3000'));