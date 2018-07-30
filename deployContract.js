const fs = require('fs');
const input = fs.readFileSync('contracts/ShortenUrl.sol', 'utf8');

console.log('Compiling contract...');

const solc = require('solc');
const output = solc.compile(input, 1);
const abi = JSON.parse(output.contracts[':ShortenUrl'].interface);
const bytecode = output.contracts[':ShortenUrl'].bytecode;
const Web3 = require('web3');
const web3 = new Web3('http://127.0.0.1:8545');

console.log('Deploying ShortenUrl Contract...');

web3.eth.getAccounts().then((accounts) => {
  const ShortenUrlContract = new web3.eth.Contract(abi);
  ShortenUrlContract.deploy({
      data: "0x" + bytecode,
    })
    .send({from: accounts[0], gas: 1000000})
    .then((instance) => {
      console.log(`Address: ${instance.options.address}`);
      const config = JSON.stringify({ contractAddress: instance.options.address });
      fs.writeFile('config.json', config, 'utf8', () => {
        console.log('Contract has been created and config file has been updated');
      });
    })
    .catch(console.log);
});