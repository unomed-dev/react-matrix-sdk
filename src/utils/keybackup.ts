import { MatrixClient } from 'matrix-js-sdk';
import { decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';
import { cacheSecretStorageKey } from './secretStorageKeys';

export const isRecoveryKeyValid = async (mx: MatrixClient, recoveryKey: string): Promise<boolean> => {
  const decodedRecoveryKey = decodeRecoveryKey(recoveryKey);
  let recoveryKeyValid = false;
  const keyId = await mx.secretStorage.getDefaultKeyId();
  const secretStorageKeyTuple = await mx.secretStorage.getKey(keyId);
  if (keyId && secretStorageKeyTuple) {
    const [, keyInfo] = secretStorageKeyTuple;
    recoveryKeyValid = await mx.secretStorage.checkKey(decodedRecoveryKey, keyInfo);
    if (recoveryKeyValid) {
      // cache the recovery key if it's valid
      cacheSecretStorageKey(keyId, keyInfo, decodedRecoveryKey);
    }
  }


  return recoveryKeyValid;
};
