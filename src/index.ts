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

export {
  useMatrixClient
} from './hooks/useMatrixClient';
export {
  default as useSso
} from './hooks/useSso';
export {
  default as MatrixClientProvider
} from './providers/MatrixClientProvider';
export {
  default as SSOAuthMatrixClientProvider
} from './providers/SSOAuthMatrixClientProvider';
export {
  default as useRooms,
} from './hooks/useRooms';
export {
  default as useLatestEvents,
} from './hooks/useLatestEvents';
export {
  default as logout,
} from './utils/logout';
export {
  default as useSingleTab,
} from './hooks/useSingleTab';
