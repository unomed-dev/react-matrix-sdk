import { createClient, IndexedDBCryptoStore, IndexedDBStore } from 'matrix-js-sdk';
import { cryptoCallbacks } from './secretStorageKeys';


const defaultConfigClient = (
  baseUrl: string,
  accessToken?: string,
  userId?: string,
  deviceId?: string,
) => {
  const indexedDBStore = new IndexedDBStore({
    indexedDB: global.indexedDB,
    localStorage: global.localStorage,
    dbName: 'web-sync-store',
  });

  return createClient({
    baseUrl,
    accessToken,
    userId,
    store: indexedDBStore,
    cryptoStore: new IndexedDBCryptoStore(global.indexedDB, 'crypto-store'),
    deviceId,
    timelineSupport: true,
    cryptoCallbacks,
    verificationMethods: [
      'm.sas.v1',
    ],
  });
};


export default defaultConfigClient;
