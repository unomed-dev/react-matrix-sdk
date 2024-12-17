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

import { createClient, MatrixClient } from 'matrix-js-sdk';
import React, { useEffect, useState } from 'react';
import useSso from '../hooks/useSso';
import MatrixClientContext from '../context/MatrixClientContext';


interface Props {
  children: React.ReactNode;
  baseUrl: string;
  ssoRedirectUrl?: string;
}

const MatrixClientProvider = ({
  children,
  baseUrl,
}: Props) => {
  const [client, setClient] = useState<MatrixClient>();

  // We only support SSO Login at the moment
  const { accessToken, userId, deviceId } = useSso(baseUrl);

  useEffect(() => {
    // console.log(accessToken, userId, deviceId);
    const mx = createClient({ baseUrl });
    setClient(mx);
  }, [baseUrl, accessToken, userId, deviceId]);


  return (
    <MatrixClientContext.Provider value={client}>
      {children}
    </MatrixClientContext.Provider>
  );
};


export default MatrixClientProvider;
