export type RoomRole = 'manager' | 'streamer';

export type RoomParams = {
  roomId: string;
  role: RoomRole;
  isObsMode: boolean;
  canManageBoard: boolean;
  isReadOnly: boolean;
};

export function getRoomParams(): RoomParams {
  const params = new URLSearchParams(window.location.search);
  const roomId = params.get('room')?.trim() || 'default';
  const isObsMode = params.get('obs') === '1';
  const role = params.get('role') === 'manager' ? 'manager' : 'streamer';

  return {
    roomId,
    role,
    isObsMode,
    canManageBoard: !isObsMode && role === 'manager',
    isReadOnly: isObsMode,
  };
}
