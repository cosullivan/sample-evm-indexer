import { ActivityTxEntity } from './types';
import { batch, ContractLog, fetchContractLogs } from './utils';
import { AbiCoder } from 'ethers';

interface RpcIndexerOptions {
  rpc: string;
  chainId: number;
  genesis: number;
  batchSize: number;
}

export class RpcIndexer {
  constructor(public readonly options: RpcIndexerOptions) {}

  key(log: ContractLog) {
    return {
      chain_id: this.options.chainId,
      tx_hash: log.transactionHash,
      tx_index: parseInt(log.transactionIndex, 16),
      log_index: parseInt(log.logIndex, 16),
      block_number: parseInt(log.blockNumber, 16),
      timestamp: 0,
    };
  }

  account(log: ContractLog, index: number = 1) {
    const abi = AbiCoder.defaultAbiCoder();
    return { account_id: abi.decode(['address'], log.topics[index])[0] };
  }

  asset(log: ContractLog, index: number = 1) {
    const abi = AbiCoder.defaultAbiCoder();
    return { asset_id: abi.decode(['address'], log.topics[index])[0] };
  }

  async fetchPortfolioSupply(from: number, to: number): Promise<Array<ActivityTxEntity>> {
    // this is the event that it is indexing
    // event Supply(
    //   address indexed account,
    //   address indexed supplier,
    //   address indexed asset,
    //   uint256 amount,
    //   uint256 shares,
    //   address caller,
    //   uint256 timestamp
    // );
    const logs = await fetchContractLogs(
      this.options.rpc,
      ['0x642dda5a3b20db268d8754c7073191deec166529'], // contract address to index, we load this dynamically
      ['0xae785e211930a61eef1c36aa6d30f446a9b1a441fd4606881f55ebed74fea0ac'], // the topic is the event hash to index
      from,
      to
    );
    const abi = AbiCoder.defaultAbiCoder();
    return logs.map((log) => {
      const data = abi.decode(['uint256', 'uint256', 'address', 'uint256'], log.data);
      return {
        ...this.key(log),
        ...this.account(log),
        ...this.asset(log, 3),
        timestamp: Number(BigInt(data[3])),
        type: 'portfolio:supply',
        metadata: {
          amount: BigInt(data[0]),
          shares: BigInt(data[1]),
        },
      };
    });
  }

  async fetchPortfolioWithdraw(from: number, to: number): Promise<Array<ActivityTxEntity>> {
    // this is the event that it is indexing
    // event Withdraw(
    //   address indexed account,
    //   address indexed asset,
    //   uint256 amount,
    //   uint256 shares,
    //   address caller,
    //   uint256 timestamp
    // );
    const logs = await fetchContractLogs(
      this.options.rpc,
      ['0x642dda5a3b20db268d8754c7073191deec166529'], // contract address to index, we load this dynamically
      ['0x18b010dae00798e3743f69318c4835c8001efd3514c7c2f748e81bf1e9dc1a1f'],
      from,
      to
    );
    const abi = AbiCoder.defaultAbiCoder();
    return logs.map((log) => {
      const data = abi.decode(['uint256', 'uint256', 'address', 'uint256'], log.data);
      return {
        ...this.key(log),
        ...this.account(log),
        ...this.asset(log, 2),
        timestamp: Number(BigInt(data[3])),
        type: 'portfolio:withdraw',
        metadata: {
          amount: BigInt(data[0]),
          shares: BigInt(data[1]),
        },
      };
    });
  }

  async fetchActivities(from: number, to: number): Promise<Array<ActivityTxEntity>> {
    // add more indexer tasks here as needed
    const promises = await Promise.all([this.fetchPortfolioSupply(from, to), this.fetchPortfolioWithdraw(from, to)]);

    return promises.flatMap((p) => p);
  }

  async run(block: number) {
    //const key = `indexer:accounts:${this.options.chainId}`;

    //const database = new Database();

    //const start = (await database.fetchState(key, Number, this.options.genesis)) + 1;

    // TODO: load this from a state storage, ie, database but if the value doesnt exist, default to the genesis block
    const start = this.options.genesis;

    await batch(start, block, this.options.batchSize, async ({ min, max }) => {
      console.log(`indexing from=${min} to=${max}`);

      const activities = await this.fetchActivities(min, max);
      if (activities.length > 0) {
        console.log(activities);
      }

      //await database.saveAccountActivity(activities);

      //await database.saveState(key, max.toString());
    });
  }
}
