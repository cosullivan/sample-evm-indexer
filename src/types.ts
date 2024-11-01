type TxEntity = {
  tx_hash: string;
  tx_index: number;
  log_index: number;
  chain_id: number;
  block_number: number;
  timestamp: number;
};

export type AccountTxEntity<T extends string> = TxEntity & {
  type: T;
  account_id: string;
  asset_id: string;
  metadata: Record<string, any>;
};

export type ActivityTxEntity = AccountTxEntity<'portfolio:supply'> | AccountTxEntity<'portfolio:withdraw'>;
