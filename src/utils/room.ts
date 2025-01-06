import { EventType, Room } from 'matrix-js-sdk';


/**
 * Helper function to check whether a room is a direct message room
 * @param room The room instance to check
 * @returns boolean True if room is a direct message room, false otherwise
 */
const isDMRoom = (room: Room) => {
  // First check if the room's dm inviter is known
  if (room.getDMInviter()) return true;

  const members = room.getMembers();

  // Check that the room has at most two members
  if (members.length > 2) return false;

  // Check if the dm inviter is known through any of the members
  if (members.some((m) => m.getDMInviter())) {
    return true;
  }

  // If the above checks do not return true, check if the room id is saved
  // in the user's m.direct account data
  const mDirect = room.client.getAccountData(EventType.Direct)?.getContent();

  let isDirect = false;
  if (mDirect) {
    Object.keys(mDirect).forEach((direct) => {
      if (mDirect[direct].some((directId: string) => directId === room.roomId)) {
        isDirect = true;
      }
    });
  }

  if (isDirect) return true;

  // If all else failed, check if the room name is equal to the other members name
  const otherUserId = room.guessDMUserId();
  const member = members.find((m) => m.userId === otherUserId);
  return member && member.rawDisplayName === room.name;
};


export {
  isDMRoom
};
