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

import { useEffect, useState } from 'react';
import { clearCredentials, getCredentials, storeCredentials } from '../auth/credentials';
import defaultConfigClient from '../utils/client';

const useSso = (baseUrl: string, loggedInUserId: string | undefined) => {
  const [accessToken, setAccessToken] = useState<string>();
  const [userId, setUserId] = useState<string>();
  const [deviceId, setDeviceId] = useState<string>();

  useEffect(() => {
    const ssoLogin = async () => {
      const queryParams = new URLSearchParams(window.location.search);
      const loginToken = queryParams.get('loginToken');
      const baseDomain = `${window.location.protocol}//${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}`;

      if (loginToken) {
        const mx = defaultConfigClient(baseUrl);
        // clear any existing stores
        await mx.clearStores();
        clearCredentials();

        try {
          const payload = await mx.loginWithToken(loginToken);
          if (payload.access_token) {
            storeCredentials(payload);
          }
        } finally {
          window.history.replaceState({}, document.title, baseDomain);
        }
      }

      const [existingAccessToken, existingUserId, existingDeviceId] = getCredentials();

      // Check if the existing credentials are valid
      let isLoggedin = false;
      if (loggedInUserId === existingUserId
        && existingAccessToken
        && existingUserId
        && existingDeviceId
      ) {
        const mx = defaultConfigClient(
          baseUrl,
          existingAccessToken,
          existingUserId,
          existingDeviceId,
        );

        try {
          await mx.whoami();
          setAccessToken(existingAccessToken);
          setUserId(existingUserId);
          setDeviceId(existingDeviceId);
          isLoggedin = true;
        } catch {
          // credentials are not valid
        }
      }

      if (!isLoggedin) {
        const mx = defaultConfigClient(baseUrl);
        // clear any existing stores
        await mx.clearStores();
        clearCredentials();
        const url = mx.getSsoLoginUrl(baseDomain, 'sso');
        window.location.replace(url);
      }
    };

    if (loggedInUserId) {
      ssoLogin();
    }
  }, [baseUrl, loggedInUserId]);

  return {
    accessToken,
    userId,
    deviceId,
  };
};

export default useSso;
