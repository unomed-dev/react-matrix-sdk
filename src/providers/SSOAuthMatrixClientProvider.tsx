/*
 * Copyright 2025 Unomed AG
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

import { IStartClientOpts } from 'matrix-js-sdk';
import useSso from '../hooks/useSso';
import MatrixClientProvider from './MatrixClientProvider';

interface Props {
  children: React.ReactNode;
  baseUrl: string;
  loggedInUserId?: string;
  enableCrypto?: boolean;
  enableKeyBackup?: boolean;
  enableCrossSigning?: boolean;
  enableDeviceDehydration?: boolean;
  rustCryptoStoreKeyFn?: () => Promise<Uint8Array | undefined>;
  recoveryKeyFn?: () => Promise<string | undefined>;
  startClientOpts?: IStartClientOpts;
};

const SSOAuthMatrixClientProvider = ({
  children,
  baseUrl,
  loggedInUserId,
  enableCrypto = false,
  enableKeyBackup = false,
  enableCrossSigning = false,
  enableDeviceDehydration = false,
  rustCryptoStoreKeyFn,
  recoveryKeyFn,
  startClientOpts,
}: Props) => {
  const { accessToken, userId, deviceId } = useSso(baseUrl, loggedInUserId);

  return (
    <MatrixClientProvider
      baseUrl={baseUrl}
      accessToken={accessToken}
      userId={userId}
      deviceId={deviceId}
      enableCrypto={enableCrypto}
      enableKeyBackup={enableKeyBackup}
      enableCrossSigning={enableCrossSigning}
      enableDeviceDehydration={enableDeviceDehydration}
      rustCryptoStoreKeyFn={rustCryptoStoreKeyFn}
      recoveryKeyFn={recoveryKeyFn}
      startClientOpts={startClientOpts}
    >
      {children}
    </MatrixClientProvider>
  );
};

export default SSOAuthMatrixClientProvider;
