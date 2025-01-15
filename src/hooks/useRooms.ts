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

import { ClientEvent, Room } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { useCallback, useEffect, useState } from 'react';
import { isDMRoom } from '../utils/room';

interface Props {
  // A search term used to filter rooms by name
  searchTerm?: string;
  dmsOnly?: boolean;
  groupChatsOnly?: boolean;
}

const useRooms = ({
  searchTerm = '',
  dmsOnly = false,
  groupChatsOnly = false,
}: Props = {}) => {
  const { mx } = useMatrixClient();
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [joinedSpaces, setJoinedSpaces] = useState<Room[]>([]);
  const [invitedSpaces, setInvitedSpaces] = useState<Room[]>([]);

  const refreshRooms = useCallback(() => {
    const _joinedRooms: Room[] = [];
    const _invitedRooms: Room[] = [];
    const _joinedSpaces: Room[] = [];
    const _invitedSpaces: Room[] = [];

    mx?.getRooms().forEach((room) => {
      // Remove rooms not matching the search term
      if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return;
      }

      if (dmsOnly && !isDMRoom(room)) {
        return;
      }

      if (groupChatsOnly && isDMRoom(room)) {
        return;
      }

      if (room.getMyMembership() === 'invite') {
        if (room.isSpaceRoom()) {
          _invitedSpaces.push(room);
        } else {
          _invitedRooms.push(room);
        }
      }

      if (room.getMyMembership() !== 'join') return;

      if (room.isSpaceRoom()) {
        _joinedSpaces.push(room);
      } else {
        _joinedRooms.push(room);
      }
    });

    setJoinedRooms(_joinedRooms);
    setInvitedRooms(_invitedRooms);
    setJoinedSpaces(_joinedSpaces);
    setInvitedSpaces(_invitedSpaces);

  }, [mx, searchTerm, dmsOnly, groupChatsOnly]);

  useEffect(() => {
    // Populate rooms when hook is mounted
    refreshRooms();
  }, [refreshRooms]);

  useEffect(() => {
    // Refresh rooms on incoming "Room" events
    mx?.on(ClientEvent.Room, refreshRooms);
    return () => {
      mx?.removeListener(ClientEvent.Room, refreshRooms);
    };
  }, [mx, refreshRooms]);

  return {
    joinedRooms,
    joinedSpaces,
    invitedRooms,
    invitedSpaces,
  };
};

export default useRooms;
