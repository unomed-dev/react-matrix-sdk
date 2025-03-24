/*
 * Copyright 2024 Unomed AG
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { ClientEvent, MatrixClient, SyncState } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import MatrixClientContext from '../context/MatrixClientContext';
import { cacheSecretStorageKey } from '../utils/secretStorageKeys';
import { CryptoApi, decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';
import defaultConfigClient from '../utils/client';


interface Props {
  children: React.ReactNode;
  baseUrl: string;
  accessToken?: string;
  userId?: string;
  deviceId?: string;
  enableCrypto?: boolean;
  enableKeyBackup?: boolean;
  enableCrossSigning?: boolean;
  enableDeviceDehydration?: boolean;
  rustCryptoStoreKeyFn?: () => Promise<Uint8Array | undefined>;
  recoveryKeyFn?: () => Promise<string | undefined>;
}

const MatrixClientProvider = ({
  children,
  baseUrl,
  accessToken,
  userId,
  deviceId,
  enableCrypto = false,
  enableKeyBackup = false,
  enableCrossSigning = false,
  enableDeviceDehydration = false,
  rustCryptoStoreKeyFn,
  recoveryKeyFn,
}: Props) => {
  const [mx, setMx] = useState<MatrixClient>();
  const [cryptoApi, setCryptoApi] = useState<CryptoApi>();

  useEffect(() => {
    // Initialize the client
    if (!accessToken || !userId || !deviceId) return;

    const client = defaultConfigClient(baseUrl, accessToken, userId, deviceId);

    (async () => {
      await client.store.startup();

      if (enableCrypto) {
        // Setup e2ee
        const rustCryptoStoreKey = await rustCryptoStoreKeyFn?.();
        if (rustCryptoStoreKey) {
          await client.initRustCrypto({ storageKey: rustCryptoStoreKey });
        } else {
          await client.initRustCrypto();
        }

        client.setGlobalErrorOnUnknownDevices(false);
        const crypto = client.getCrypto();
        setCryptoApi(crypto);
      }

      // Start syncing
      await client.startClient({ lazyLoadMembers: true });

      // Activate Key Backup
      if (enableCrypto && enableKeyBackup && recoveryKeyFn) {
        const recoveryKey = await recoveryKeyFn?.();

        // Validate the recovery key
        let recoveryKeyValid = false;

        if (recoveryKey) {
          const decodedRecoveryKey = decodeRecoveryKey(recoveryKey);
          const keyId = await client.secretStorage.getDefaultKeyId();
          const secretStorageKeyTuple = await client.secretStorage.getKey(keyId);
          if (keyId && secretStorageKeyTuple) {
            const [, keyInfo] = secretStorageKeyTuple;
            recoveryKeyValid = await client.secretStorage.checkKey(decodedRecoveryKey, keyInfo);

            if (recoveryKeyValid) {
              // cache the recovery key if it's valid
              cacheSecretStorageKey(keyId, keyInfo, decodedRecoveryKey);
            }
          }
        }

        if (recoveryKeyValid) {
          const crypto = client.getCrypto();
          const hasKeyBackup = (await crypto?.checkKeyBackupAndEnable()) !== null;
          if (hasKeyBackup) {
            await crypto?.loadSessionBackupPrivateKeyFromSecretStorage();
          }
        }
      }

      // Activate cross-signing
      if (enableCrypto && enableCrossSigning) {
        // Cache missing cross-signing keys locally, and setup cross-signing
        const crypto = client.getCrypto();
        await crypto?.userHasCrossSigningKeys(client.getUserId() || undefined, true);
        await crypto?.bootstrapCrossSigning({});
      }

      // Activate device dehydration
      if (enableCrypto && enableKeyBackup && enableCrossSigning && enableDeviceDehydration) {
        // If supported, rehydrate from existing device (if exists) and start regular device dehydration
        const crypto = client.getCrypto();
        const dehydrationSupported = await crypto?.isDehydrationSupported();
        if (dehydrationSupported) {
          try {
            await crypto?.startDehydration();
          } catch {
            // create new dehydration key if dehydration fails to start
            await crypto?.startDehydration(true);
          }
        }
      }
    })();

    const handleStateChange = (state: SyncState) => {
      // Make the client available after the first sync has completed
      if (state === SyncState.Prepared) {
        setMx(client);
      }
    };

    client.on(ClientEvent.Sync, handleStateChange);
    return () => {
      client.removeListener(ClientEvent.Sync, handleStateChange);
      // Clean up matrix client on unmount
      client.stopClient();
    };
  }, [
    baseUrl,
    enableCrypto,
    enableKeyBackup,
    enableCrossSigning,
    enableDeviceDehydration,
    recoveryKeyFn,
    rustCryptoStoreKeyFn,
    accessToken,
    userId,
    deviceId
  ]);

  return (
    <MatrixClientContext.Provider value={{
      mx,
      cryptoApi
    }}>
      {children}
    </MatrixClientContext.Provider>
  );
};


export default MatrixClientProvider;
