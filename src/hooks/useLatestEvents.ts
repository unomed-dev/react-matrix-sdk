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

import { EventType, Filter, JoinRule, MatrixClient, MatrixEvent, MatrixEventEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useEffect, useState } from 'react';
import { useMatrixClient } from './useMatrixClient';


interface Props {
  rooms?: Room[];
}

enum Modification {
  None,
  Unset,
  Set,
  Changed,
}

const getModification = (prev?: string, value?: string): Modification => {
  if (prev && value && prev !== value) {
    return Modification.Changed;
  }
  if (prev && !value) {
    return Modification.Unset;
  }
  if (!prev && value) {
    return Modification.Set;
  }

  return Modification.None;
};

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

    const displayNameMod = getModification(prevContent.displayname, content.displayname);
    if (displayNameMod === Modification.Changed || displayNameMod === Modification.Set || displayNameMod === Modification.Unset) {
      // Ignore display name changes
      return false;
    }

    const avatarMod = getModification(prevContent.avatar_url, content.avatar_url);
    if (avatarMod === Modification.Changed || avatarMod === Modification.Set || avatarMod === Modification.Unset) {
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
      const filter = new Filter(mx.getUserId());
      filter.setDefinition({
        room: {
          timeline: {
            types: [EventType.RoomMessage],
          },
        },
      });
      const _latestEvents = rooms.map((room) => {
        const eventTimelineSet = room.getOrCreateFilteredTimelineSet(filter);
        const events = eventTimelineSet.getLiveTimeline().getEvents();
        return events[events.length - 1];
      });
      const decryptionPromises = _latestEvents.map((event) => {
        if (event) return mx.decryptEventIfNeeded(event);
        return Promise.resolve(undefined);
      });
      Promise.all(decryptionPromises).then(() => setLatestEvents(_latestEvents));
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

  // useEffect(() => {
  //   const onEvent = (event: MatrixEvent) => {
  //     console.log('onEvent', event);
  //   };
  //
  //   mx?.on(ClientEvent.Event, onEvent);
  //   return () => {
  //     mx?.removeListener(ClientEvent.Event, onEvent);
  //   };
  // }, [mx]);

  return latestEvents;
};

export default useLatestEvents;
