/*
 * Copyright 2024-2025 Unomed AG
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

import { MatrixClient } from 'matrix-js-sdk';
import { CryptoApi } from 'matrix-js-sdk/lib/crypto-api';
import { createContext } from 'react';

export interface IMatrixClientContext {
  mx?: MatrixClient;
  cryptoApi?: CryptoApi;
}

const MatrixClientContext = createContext<IMatrixClientContext>({});

export default MatrixClientContext;
