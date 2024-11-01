import { RpcIndexer } from './RpcIndexer';
import { fetchRPC } from './utils/fetchRPC';

// we load these from environment variables
const RPC_URL = 'https://api.hyperliquid-testnet.xyz/evm';
const CHAIN_ID = 998;
const BATCH_SIZE = 50; // the HL RPC cant handle large batch sizes so need to keep this small
const GENESIS_BLOCK = 8899900;

// this would run as a continuous job pretty much non-stop, maybe with a little delay in between each occurance
// it should run from genesis up to the current block and then stop and then when running again it will pick up from
// the last block that it processed
async function main() {
  // fetch the current block so we know what to run to
  const response = await fetchRPC<string>(RPC_URL, 'eth_blockNumber');
  const block = parseInt(response, 16);

  // run the indexer from the last successful block that it processed up until the current block
  const indexer = new RpcIndexer({
    rpc: RPC_URL,
    chainId: CHAIN_ID,
    batchSize: BATCH_SIZE,
    genesis: GENESIS_BLOCK,
  });
  await indexer.run(block);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
