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

import { createClient } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { clearCredentials, getCredentials, storeCredentials } from '../auth/credentials';

const useSso = (baseUrl: string) => {
  const [accessToken, setAccessToken] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const [deviceId, setDeviceId] = useState<string>();

  useEffect(() => {

    const ssoLogin = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const loginToken = queryParams.get('loginToken');

      const [accessToken, userId, deviceId] = getCredentials();

      let isLoggedIn = false;
      // Check if the existing credentials are valid
      if (accessToken && userId && deviceId) {
        const mx = createClient({ baseUrl, accessToken, userId, deviceId });
        try {
          await mx.whoami();
          isLoggedIn = true;
          setAccessToken(accessToken);
          setUserId(userId);
          setDeviceId(deviceId);
        } catch {
          // credentials are not valid
        }
      }

      if (!isLoggedIn) {
        const mx = createClient({ baseUrl });
        const baseDomain = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;
        if (loginToken) {
          const payload = await mx.loginWithToken(loginToken);
          if (payload.access_token) {
            storeCredentials(payload);
            window.location.replace(baseDomain);
          } else {
            clearCredentials();
          }
        } else {
          clearCredentials();
          const url = mx.getSsoLoginUrl(baseDomain, 'sso');
          window.location.replace(url);
        }
      }
    };

    ssoLogin();
  }, [baseUrl]);

  return {
    accessToken,
    userId,
    deviceId,
  };
};

export default useSso;
