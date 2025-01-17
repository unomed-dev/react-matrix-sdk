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

import { EventType, JoinRule, MatrixClient, MatrixEvent, MatrixEventEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';


interface Props {
  rooms?: Room[];
}

const shouldShowEvent = (mx: MatrixClient, event: MatrixEvent) => {
  const eventType = event.getType();
  const content = event.getContent();
  const prevContent = event.getPrevContent();

  if (eventType === EventType.RoomMember) {

    const room = mx.getRoom(event.getRoomId());
    if (room?.getJoinRule() === JoinRule.Public) {
      // Do not show room member events in public rooms
      return false;
    }

    if (prevContent.displayname && prevContent.displayname !== content.displayname) {
      // Ignore display name changes
      return false;
    }

    if (prevContent.avatar_url && prevContent.avatar_url !== content.avatar_url) {
      // Ignore avatar changes
      return false;
    }
    return true;
  }

  return eventType === EventType.RoomMessage;
};


// Obtain the latest message event per room
const useLatestEvents = ({
  rooms = [],
}: Props = {}) => {
  const { mx } = useMatrixClient();
  const [latestEvents, setLatestEvents] = useState<(MatrixEvent | undefined)[]>([]);

  useEffect(() => {
    if (mx) {
      const getLatestPreviewEvent = async (room: Room) => {
        const lastLiveEvent = room.getLastLiveEvent();

        if (lastLiveEvent && shouldShowEvent(mx, lastLiveEvent)) {
          await mx.decryptEventIfNeeded(lastLiveEvent);
          return lastLiveEvent;
        }

        const events = room.getLiveTimeline().getEvents();
        const decryptionPromises = events.map((event) => mx.decryptEventIfNeeded(event));
        await Promise.all(decryptionPromises);

        const decryptedEvents = room.getLiveTimeline().getEvents();
        for (let i = decryptedEvents.length - 1; i >= 0; i -= 1) {
          const event = decryptedEvents[i];
          if (shouldShowEvent(mx, event)) {
            return event;
          }
        }

        return undefined;
      };

      (async () => {
        const latestEventsPromises = rooms.map((room) => getLatestPreviewEvent(room));
        const _latestEvents = await Promise.all(latestEventsPromises);

        setLatestEvents(_latestEvents);

        const undefinedIndexes = _latestEvents.map(
          (value, index) => value === undefined ? index : undefined
        ).filter(
          (index) => index !== undefined
        );

        const backPaginationPromises = undefinedIndexes.map(
          (index) => {
            const room = rooms[index];
            const timeline = room.getLiveTimeline();
            return mx?.paginateEventTimeline(timeline, {
              backwards: true,
              limit: 10,
            });
          }
        );
        await Promise.all(backPaginationPromises);

        const newLatestEventsPromises = rooms.map((room) => getLatestPreviewEvent(room));
        const _newLatestEvents = await Promise.all(newLatestEventsPromises);

        setLatestEvents(_newLatestEvents);
      })();
    }
  }, [mx, rooms]);

  useEffect(() => {
    // update when a new live event arrives in one of the rooms
    const updateLatestEvent = async (
      event: MatrixEvent,
      room: Room | undefined,
    ) => {
      if (mx && room) {
        await mx?.decryptEventIfNeeded(event);
        if (shouldShowEvent(mx, event)) {
          const index = rooms.findIndex((entry) => entry.roomId === room.roomId);
          if (index > -1) {
            if (event.getTs() > (latestEvents[index]?.getTs() || 0)) {
              latestEvents[index] = event;
              setLatestEvents([...latestEvents]);
            }
          }
        }
      }
    };

    mx?.on(RoomEvent.Timeline, updateLatestEvent);
    return () => {
      mx?.removeListener(RoomEvent.Timeline, updateLatestEvent);
    };
  }, [mx, rooms, latestEvents]);

  useEffect(() => {
    // Rerender if latest events are decrypted
    const refreshEvents = () => setLatestEvents([...latestEvents]);
    latestEvents.forEach((event) => {
      event?.on(MatrixEventEvent.Decrypted, refreshEvents);
    });
    return () => {
      latestEvents.forEach((event) => {
        event?.removeListener(MatrixEventEvent.Decrypted, refreshEvents);
      });
    };
  }, [latestEvents]);

  return latestEvents;
};

export default useLatestEvents;
