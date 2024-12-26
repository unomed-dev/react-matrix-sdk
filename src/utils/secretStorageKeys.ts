import { ICryptoCallbacks } from 'matrix-js-sdk';
import { ISecretStorageKeyInfo } from 'matrix-js-sdk/lib/crypto/api';
import { SecretStorageKeyDescriptionAesV1 } from 'matrix-js-sdk/lib/secret-storage';

const secretStorageKeys = new Map();

const storePrivateKey = (keyId: string, privateKey: Uint8Array) => {
  if (privateKey instanceof Uint8Array === false) {
    throw new Error('Unable to store, privateKey is invalid.');
  }
  secretStorageKeys.set(keyId, privateKey);
};

const hasPrivateKey = (keyId: string) => secretStorageKeys.get(keyId) instanceof Uint8Array;

const getPrivateKey = (keyId: string) => secretStorageKeys.get(keyId);

const deletePrivateKey = (keyId: string) => {
  secretStorageKeys.delete(keyId);
};

const clearSecretStorageKeys = () => {
  secretStorageKeys.clear();
};

const getSecretStorageKey = async ({ keys }: {
  keys: Record<string, ISecretStorageKeyInfo>;
}): Promise<[string, Uint8Array]> => {
  const keyIds = Object.keys(keys);
  const keyId = keyIds.find(hasPrivateKey);
  if (!keyId) {
    throw new Error(`Unable to get key ${keyId}`);
  }
  const privateKey = getPrivateKey(keyId);
  return [keyId, privateKey];
};

function cacheSecretStorageKey(
  keyId: string,
  keyInfo: SecretStorageKeyDescriptionAesV1,
  privateKey: Uint8Array,
) {
  secretStorageKeys.set(keyId, privateKey);
}

const cryptoCallbacks: ICryptoCallbacks = {
  getSecretStorageKey,
  cacheSecretStorageKey,
};

export {
  cryptoCallbacks,
  cacheSecretStorageKey,
  storePrivateKey,
  deletePrivateKey,
  clearSecretStorageKeys,
};
