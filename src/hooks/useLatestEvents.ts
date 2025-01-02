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

import { EventType, MatrixEvent, Room } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';


interface Props {
  rooms?: Room[];
  eventTypes?: EventType[];
}

// Obtain the latest message event per room
const useLatestEvents = ({
  rooms = [],
}: Props = {}) => {
  const { mx, cryptoApi } = useMatrixClient();
  const [latestEvents, setLatestEvents] = useState<(MatrixEvent | undefined)[]>([]);

  useEffect(() => {
    if (mx && cryptoApi) {
      (async () => {
        const decryptionPromises = rooms.map((room) => room.decryptCriticalEvents());
        await Promise.all(decryptionPromises);
        const _latestEvents = rooms.map((room) => {
          const events = room.getLiveTimeline().getEvents();

          for (let i = events.length - 1; i >= 0; i -= 1) {
            if (EventType.RoomMessage === events[i].getType()) {
              return events[i];
            }
          }
          return undefined;
        });
        setLatestEvents(_latestEvents);
      })();
    }
  }, [mx, cryptoApi, rooms]);

  return latestEvents;
};

export default useLatestEvents;
