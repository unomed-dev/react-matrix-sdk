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

import { useEffect } from 'react';
import { MatrixClient } from 'matrix-js-sdk';
import { decodeRecoveryKey } from 'matrix-js-sdk/lib/crypto-api';
import { cacheSecretStorageKey } from '../utils/secretStorageKeys';
import { isRecoveryKeyValid } from '../utils/keybackup';

interface Props {
  mx: MatrixClient
  rustCryptoStoreKey?: Uint8Array;
  recoveryKey?: string;
}

const useCrypto = ({
  mx,
  rustCryptoStoreKey,
  recoveryKey,
}: Props) => {

  useEffect(() => {
    const initCrypto = async () => {
      if (rustCryptoStoreKey) {
        await mx.initRustCrypto({ storageKey: rustCryptoStoreKey });
      } else {
        await mx.initRustCrypto();
      }

      mx.setGlobalErrorOnUnknownDevices(false);
      const crypto = mx.getCrypto();

      // Cache missing cross-signing keys locally, and setup cross-signing
      await crypto?.userHasCrossSigningKeys(mx.getUserId() || undefined, true);
      await crypto?.bootstrapCrossSigning({});

      let recoveryKeyValid = false;
      if (recoveryKey) {
        recoveryKeyValid = await isRecoveryKeyValid(mx, recoveryKey);
      }

      if (recoveryKeyValid) {
        const hasKeyBackup = (await crypto?.checkKeyBackupAndEnable()) !== null;
        if (hasKeyBackup) await crypto?.restoreKeyBackup();
      }


      // If supported, rehydrate from existing device (if exists) and start regular device dehydration
      const dehydrationSupported = await crypto?.isDehydrationSupported();
      if (dehydrationSupported) {
        try {
          await crypto?.startDehydration();
        } catch {
          // create new dehydration key if dehydration fails to start
          await crypto?.startDehydration(true);
        }
      }
    };
    initCrypto();
  }, [mx, recoveryKey, rustCryptoStoreKey]);

};

export default useCrypto;
