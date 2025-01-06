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

import { ClientEvent, createClient, IndexedDBCryptoStore, IndexedDBStore, MatrixClient, SyncState } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import useSso from '../hooks/useSso';
import MatrixClientContext from '../context/MatrixClientContext';
import { cacheSecretStorageKey, cryptoCallbacks } from '../utils/secretStorageKeys';
import { CryptoApi, decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';


interface Props {
  children: React.ReactNode;
  baseUrl: string;
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
  enableCrypto = false,
  enableKeyBackup = false,
  enableCrossSigning = false,
  enableDeviceDehydration = false,
  rustCryptoStoreKeyFn,
  recoveryKeyFn,
}: Props) => {
  // We only support SSO Login at the moment
  const { accessToken, userId, deviceId } = useSso(baseUrl);
  const [mx, setMx] = useState<MatrixClient>();
  const [cryptoApi, setCryptoApi] = useState<CryptoApi>();

  useEffect(() => {
    // Initialize the client
    if (!accessToken || !userId || !deviceId) return;

    const indexedDBStore = new IndexedDBStore({
      indexedDB: global.indexedDB,
      localStorage: global.localStorage,
      dbName: 'web-sync-store',
    });

    const client = createClient({
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

    (async () => {
      await indexedDBStore.startup();

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
    })();

    const handleStateChange = (state: SyncState) => {
      // Make the client available after the first sync has completed
      if (state === SyncState.Prepared) setMx(client);
    };

    client.on(ClientEvent.Sync, handleStateChange);
    return () => {
      client.removeListener(ClientEvent.Sync, handleStateChange);
      // Clean up matrix client on unmount
      client.stopClient();
    };
  }, [baseUrl, enableCrypto, rustCryptoStoreKeyFn, accessToken, userId, deviceId]);

  useEffect(() => {
    // Add recovery key and enable
    if (enableKeyBackup && recoveryKeyFn && mx) {
      (async () => {
        const recoveryKey = await recoveryKeyFn?.();

        // Validate the recovery key
        let recoveryKeyValid = false;

        if (recoveryKey) {
          const decodedRecoveryKey = decodeRecoveryKey(recoveryKey);
          const keyId = await mx?.secretStorage.getDefaultKeyId();
          const secretStorageKeyTuple = await mx?.secretStorage.getKey(keyId);
          if (keyId && secretStorageKeyTuple) {
            const [, keyInfo] = secretStorageKeyTuple;
            recoveryKeyValid = await mx.secretStorage.checkKey(decodedRecoveryKey, keyInfo);

            if (recoveryKeyValid) {
              // cache the recovery key if it's valid
              cacheSecretStorageKey(keyId, keyInfo, decodedRecoveryKey);
            }
          }
        }

        if (recoveryKeyValid) {
          const hasKeyBackup = (await cryptoApi?.checkKeyBackupAndEnable()) !== null;
          if (hasKeyBackup) {
            await cryptoApi?.loadSessionBackupPrivateKeyFromSecretStorage();
          }
        }
      })();
    }
  }, [enableKeyBackup, mx, cryptoApi, recoveryKeyFn]);

  useEffect(() => {
    if (enableCrossSigning) {
      (async () => {
        // Cache missing cross-signing keys locally, and setup cross-signing
        await cryptoApi?.userHasCrossSigningKeys(mx?.getUserId() || undefined, true);
        await cryptoApi?.bootstrapCrossSigning({});
      })();
    }
  }, [enableCrossSigning, mx, cryptoApi]);

  useEffect(() => {
    if (enableDeviceDehydration) {
      (async () => {
        // If supported, rehydrate from existing device (if exists) and start regular device dehydration
        const dehydrationSupported = await cryptoApi?.isDehydrationSupported();
        if (dehydrationSupported) {
          try {
            await cryptoApi?.startDehydration();
          } catch {
            // create new dehydration key if dehydration fails to start
            await cryptoApi?.startDehydration(true);
          }
        }
      })();
    }
  }, [enableDeviceDehydration, cryptoApi]);

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
