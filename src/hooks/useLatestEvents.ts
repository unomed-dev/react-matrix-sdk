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

import { EventType, IRoomTimelineData, MatrixEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';


interface Props {
  rooms?: Room[];
}

// Obtain the latest message event per room
const useLatestEvents = ({
  rooms = [],
}: Props = {}) => {
  const { mx } = useMatrixClient();
  const [latestEvents, setLatestEvents] = useState<(MatrixEvent | undefined)[]>([]);

  useEffect(() => {
    if (mx) {
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
  }, [mx, rooms]);

  useEffect(() => {
    // update when a new live event arrives in one of the rooms
    const updateLatestEvent = async (
      event: MatrixEvent,
      room: Room | undefined,
      _toStartOfTimeline: boolean | undefined,
      _removed: boolean | undefined,
      data: IRoomTimelineData,
    ) => {
      if (data.liveEvent && room) {
        await mx?.decryptEventIfNeeded(event);

        if (EventType.RoomMessage === event.getType()) {
          const index = rooms.findIndex((entry) => entry.roomId === room.roomId);
          if (index > -1) {
            latestEvents[index] = event;
            setLatestEvents([...latestEvents]);
          }
        }
      }
    };

    mx?.on(RoomEvent.Timeline, updateLatestEvent);
    return () => {
      mx?.removeListener(RoomEvent.Timeline, updateLatestEvent);
    };
  }, [mx, rooms, latestEvents]);

  return latestEvents;
};

export default useLatestEvents;
