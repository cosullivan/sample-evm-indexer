import fetch from 'node-fetch';
import { retry } from './retry';

type JsonRPCResponse<T> = { result: T } | { error: { code: number; message: string } };

export const tryFetchRPC = async <T>(rpc: string, method: string, params?: any): Promise<JsonRPCResponse<T>> => {
  const options = {
    method: 'POST',
    headers: { accept: 'application/json', 'content-type': 'application/json' },
    body: JSON.stringify({ id: 1, jsonrpc: '2.0', method, params }),
  };

  const response = await retry<JsonRPCResponse<T>>(() => fetch(rpc, options));

  return response;
};

export const fetchRPC = async <T>(rpc: string, method: string, params?: any): Promise<T> => {
  const errorOrResult = await tryFetchRPC<T>(rpc, method, params);

  if ('error' in errorOrResult) {
    throw new Error(errorOrResult.error.message);
  }

  return errorOrResult.result;
};
