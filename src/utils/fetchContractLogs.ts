import { tryFetchRPC } from './fetchRPC';
import { toHex } from './toHex';

export interface ContractLog {
  address: string;
  topics: string[];
  blockNumber: string;
  data: string;
  transactionHash: string;
  transactionIndex: string;
  blockHash: string;
  logIndex: string;
  removed: boolean;
}

export const fetchContractLogs = async (
  rpc: string,
  contracts: string[],
  topics: string[],
  from: number,
  to: number
) => {
  const params = { fromBlock: toHex(from), toBlock: toHex(to), address: contracts, topics };

  const errorOrResult = await tryFetchRPC<ContractLog[]>(rpc, 'eth_getLogs', [params]);

  if ('error' in errorOrResult) {
    // workaround for the Hyperliquid testnet RPC issues
    return [];
    //throw Error(errorOrResult.error.message);
  }

  return errorOrResult.result ?? [];
};
