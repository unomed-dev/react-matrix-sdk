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

import { useCallback, useEffect, useState } from 'react';

const SESSION_KEY = 'app-tab-open';

// This hook helps to detect whether the app is opened in multiple tabs
const useSingleTab = () => {
  const [isOpenInAnotherTab, setIsOpenInAnotherTab] = useState<boolean>(false);
  const [channel, setChannel] = useState<BroadcastChannel>();

  useEffect(() => {
    const newChannel = new BroadcastChannel('app-channel');
    setChannel(newChannel);
    return () => {
      setChannel(undefined);
      newChannel.close();
    };
  }, []);

  useEffect(() => {
    if (!channel) return;

    const timestamp = Date.now();

    // Store the current tab's timestamp
    sessionStorage.setItem(SESSION_KEY, timestamp.toString());

    // Notify other tabs that a new tab was opened
    channel.postMessage({ type: 'NEW_TAB_OPENED', timestamp });

    // Listen for messages from other tabs
    channel.onmessage = (event) => {
      if (event.data.type === 'NEW_TAB_OPENED') {
        const existingTimestamp = sessionStorage.getItem(SESSION_KEY);

        if (existingTimestamp && Number(existingTimestamp) < event.data.timestamp) {
          setIsOpenInAnotherTab(true);
        }
      }
    };

    return () => {
      sessionStorage.removeItem(SESSION_KEY);
    };
  }, [channel]);

  const setUseThisTab = useCallback(() => {
    const timestamp = Date.now();
    // Store the current tab's timestamp
    sessionStorage.setItem(SESSION_KEY, timestamp.toString());
    channel?.postMessage({ type: 'NEW_TAB_OPENED', timestamp });
    setIsOpenInAnotherTab(false);
  }, [channel]);


  return {
    isOpenInAnotherTab,
    setUseThisTab,
  };
};

export default useSingleTab;

