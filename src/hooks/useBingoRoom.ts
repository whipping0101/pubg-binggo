import { useCallback, useEffect, useRef, useState } from 'react';
import { createInitialBoardIds } from '../lib/bingoUtils';
import { isSupabaseConfigured, supabase, type BingoRoomRow } from '../lib/supabase';

export type SyncStatus = 'loading' | 'ready' | 'offline' | 'error';

type BingoRoomState = {
  boardMissionIds: number[];
  completed: Set<number>;
};

function toRoomState(row: Pick<BingoRoomRow, 'board_mission_ids' | 'completed_ids'>): BingoRoomState {
  return {
    boardMissionIds: row.board_mission_ids,
    completed: new Set(row.completed_ids),
  };
}

function serializeState(state: BingoRoomState): string {
  return JSON.stringify({
    boardMissionIds: state.boardMissionIds,
    completedIds: Array.from(state.completed).sort((a, b) => a - b),
  });
}

export function useBingoRoom(roomId: string, isReadOnly: boolean) {
  const [boardMissionIds, setBoardMissionIds] = useState<number[]>([]);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<SyncStatus>(
    isSupabaseConfigured ? 'loading' : 'offline'
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const lastSyncedPayloadRef = useRef('');
  const roomIdRef = useRef(roomId);
  const stateRef = useRef<BingoRoomState>({
    boardMissionIds: [],
    completed: new Set<number>(),
  });

  const applyState = useCallback((next: BingoRoomState) => {
    stateRef.current = next;
    setBoardMissionIds(next.boardMissionIds);
    setCompleted(next.completed);
  }, []);

  const persistState = useCallback(
    async (next: BingoRoomState) => {
      if (!supabase || isReadOnly) return;

      const payload = serializeState(next);
      lastSyncedPayloadRef.current = payload;

      const { error } = await supabase.from('bingo_rooms').upsert(
        {
          id: roomIdRef.current,
          board_mission_ids: next.boardMissionIds,
          completed_ids: Array.from(next.completed),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
      }
    },
    [isReadOnly]
  );

  const updateState = useCallback(
    (updater: (current: BingoRoomState) => BingoRoomState) => {
      if (isReadOnly) return;

      const next = updater(stateRef.current);
      applyState(next);

      if (isSupabaseConfigured) {
        void persistState(next);
      }
    },
    [applyState, isReadOnly, persistState]
  );

  useEffect(() => {
    roomIdRef.current = roomId;

    if (!isSupabaseConfigured || !supabase) {
      const initial = {
        boardMissionIds: createInitialBoardIds(),
        completed: new Set<number>(),
      };
      applyState(initial);
      setStatus('offline');
      return;
    }

    let isMounted = true;

    const loadRoom = async () => {
      setStatus('loading');
      setErrorMessage(null);

      const { data, error } = await supabase
        .from('bingo_rooms')
        .select('board_mission_ids, completed_ids')
        .eq('id', roomId)
        .maybeSingle();

      if (!isMounted) return;

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
        return;
      }

      if (data) {
        const next = toRoomState(data);
        lastSyncedPayloadRef.current = serializeState(next);
        applyState(next);
        setStatus('ready');
        return;
      }

      const initial = {
        boardMissionIds: createInitialBoardIds(),
        completed: new Set<number>(),
      };

      if (!isReadOnly) {
        const { error: insertError } = await supabase.from('bingo_rooms').insert({
          id: roomId,
          board_mission_ids: initial.boardMissionIds,
          completed_ids: [],
        });

        if (!isMounted) return;

        if (insertError?.code === '23505') {
          const { data: existing, error: refetchError } = await supabase
            .from('bingo_rooms')
            .select('board_mission_ids, completed_ids')
            .eq('id', roomId)
            .single();

          if (!isMounted) return;

          if (refetchError || !existing) {
            setStatus('error');
            setErrorMessage(refetchError?.message ?? insertError.message);
            return;
          }

          const next = toRoomState(existing);
          lastSyncedPayloadRef.current = serializeState(next);
          applyState(next);
          setStatus('ready');
          return;
        }

        if (insertError) {
          setStatus('error');
          setErrorMessage(insertError.message);
          return;
        }
      }

      lastSyncedPayloadRef.current = serializeState(initial);
      applyState(initial);
      setStatus('ready');
    };

    void loadRoom();

    const channel = supabase
      .channel(`bingo-room-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bingo_rooms',
          filter: `id=eq.${roomId}`,
        },
        (payload) => {
          const row = (payload.new ?? payload.old) as BingoRoomRow | undefined;
          if (!row?.board_mission_ids) return;

          const next = toRoomState(row);
          const payloadKey = serializeState(next);
          if (payloadKey === lastSyncedPayloadRef.current) return;

          lastSyncedPayloadRef.current = payloadKey;
          applyState(next);
        }
      )
      .subscribe((subscriptionStatus, err) => {
        if (!isMounted) return;

        if (subscriptionStatus === 'SUBSCRIBED') {
          setStatus((current) => (current === 'error' ? current : 'ready'));
          return;
        }

        if (subscriptionStatus === 'CHANNEL_ERROR' || subscriptionStatus === 'TIMED_OUT') {
          setStatus('error');
          setErrorMessage(
            err?.message ?? 'Realtime 연결 실패. Supabase에서 bingo_rooms Realtime을 켜주세요.'
          );
        }
      });

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [applyState, isReadOnly, roomId]);

  const toggleCell = useCallback(
    (id: number) => {
      updateState(({ boardMissionIds: board, completed: currentCompleted }) => {
        const nextCompleted = new Set(currentCompleted);
        if (nextCompleted.has(id)) {
          nextCompleted.delete(id);
        } else {
          nextCompleted.add(id);
        }
        return { boardMissionIds: board, completed: nextCompleted };
      });
    },
    [updateState]
  );

  const resetRandomCell = useCallback(() => {
    updateState(({ boardMissionIds: board, completed: currentCompleted }) => {
      if (currentCompleted.size === 0) {
        return { boardMissionIds: board, completed: currentCompleted };
      }

      const completedArray = Array.from(currentCompleted);
      const randomId = completedArray[Math.floor(Math.random() * completedArray.length)];
      const nextCompleted = new Set(currentCompleted);
      nextCompleted.delete(randomId);
      return { boardMissionIds: board, completed: nextCompleted };
    });
  }, [updateState]);

  const resetRandomRow = useCallback(() => {
    updateState(({ boardMissionIds: board, completed: currentCompleted }) => {
      const randomRow = Math.floor(Math.random() * 4);
      const rowIds = Array.from({ length: 4 }, (_, i) => board[randomRow * 4 + i]);
      const nextCompleted = new Set(currentCompleted);
      rowIds.forEach((id) => nextCompleted.delete(id));
      return { boardMissionIds: board, completed: nextCompleted };
    });
  }, [updateState]);

  const shuffleBoard = useCallback(() => {
    updateState(() => ({
      boardMissionIds: createInitialBoardIds(),
      completed: new Set<number>(),
    }));
  }, [updateState]);

  return {
    boardMissionIds,
    completed,
    status,
    errorMessage,
    toggleCell,
    resetRandomCell,
    resetRandomRow,
    shuffleBoard,
  };
}
