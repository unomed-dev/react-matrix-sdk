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

import { ClientEvent, Room, RoomEvent } from 'matrix-js-sdk';
import { useMatrixClient } from './useMatrixClient';
import { useEffect, useState } from 'react';

interface Props {
  // A search term used to filter rooms by name
  searchTerm?: string;
}

const useRooms = ({
  searchTerm = '',
}: Partial<Props> = {}) => {
  const { mx } = useMatrixClient();
  const [joinedRooms, setJoinedRooms] = useState<Room[]>([]);
  const [invitedRooms, setInvitedRooms] = useState<Room[]>([]);
  const [joinedSpaces, setJoinedSpaces] = useState<Room[]>([]);
  const [invitedSpaces, setInvitedSpaces] = useState<Room[]>([]);

  useEffect(() => {
    const _joinedRooms: Room[] = [];
    const _invitedRooms: Room[] = [];
    const _joinedSpaces: Room[] = [];
    const _invitedSpaces: Room[] = [];

    const refreshRooms = () => {
      mx?.getRooms().forEach((room) => {

        // Remove rooms not matching the search term
        if (searchTerm && !room.name.toLowerCase().includes(searchTerm.toLowerCase())) {
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
    };

    refreshRooms();

    mx?.on(RoomEvent.Name, refreshRooms);
    mx?.on(ClientEvent.AccountData, refreshRooms);
    mx?.on(RoomEvent.MyMembership, refreshRooms);
    return () => {
      mx?.removeListener(RoomEvent.Name, refreshRooms);
      mx?.removeListener(ClientEvent.AccountData, refreshRooms);
      mx?.removeListener(RoomEvent.MyMembership, refreshRooms);
    };
  }, [mx, searchTerm]);

  return {
    joinedRooms,
    joinedSpaces,
    invitedRooms,
    invitedSpaces,
  };
};

export default useRooms;
