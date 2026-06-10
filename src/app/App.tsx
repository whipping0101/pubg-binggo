import { useEffect } from 'react';
import { missionById } from '../data/missions';
import { countBingo } from '../lib/bingoUtils';
import { getRoomParams } from '../lib/roomParams';
import { useBingoRoom } from '../hooks/useBingoRoom';

const roomParams = getRoomParams();

function getStatusLabel(status: string, role: string) {
  if (status === 'loading') return '동기화 연결 중...';
  if (status === 'error') return '동기화 오류';
  if (status === 'offline') return '로컬 모드 (Supabase 미설정)';
  if (role === 'manager') return '매니저 · 실시간 동기화';
  if (roomParams.isObsMode) return 'OBS · 실시간 동기화';
  return '스트리머 · 실시간 동기화';
}

export default function App() {
  useEffect(() => {
    if (!roomParams.isObsMode) return;
    document.documentElement.classList.add('obs-mode');
    return () => document.documentElement.classList.remove('obs-mode');
  }, []);

  const {
    boardMissionIds,
    completed,
    status,
    errorMessage,
    toggleCell,
    resetRandomCell,
    resetRandomRow,
    shuffleBoard,
  } = useBingoRoom(roomParams.roomId, roomParams.isReadOnly);

  const bingoCount = countBingo(boardMissionIds, completed);
  const canToggleCells = !roomParams.isReadOnly;
  const showControls = roomParams.canManageBoard;

  return (
    <div
      className={`size-full flex flex-col items-center justify-center p-8 font-sans ${
        roomParams.isObsMode ? 'bg-transparent' : 'bg-app-bg'
      }`}
    >
      {!roomParams.isObsMode && (
        <div className="mb-4 text-center text-sm text-app-white/60">
          <p>
            방: <span className="text-app-pink-light font-semibold">{roomParams.roomId}</span> ·{' '}
            {getStatusLabel(status, roomParams.role)}
          </p>
          {status === 'offline' && (
            <p className="mt-2 text-app-pink-light">
              .env 파일에 VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY를 설정한 뒤 dev 서버를 재시작하세요.
            </p>
          )}
          {errorMessage && <p className="mt-1 text-red-400">{errorMessage}</p>}
        </div>
      )}

      <header className="w-full max-w-2xl mb-8">
        <div className="flex flex-col sm:flex-row sm:justify-center sm:items-start gap-6 sm:gap-12 px-2">
          <div className="text-left">
            <h1 className="text-5xl font-bold text-app-pink mb-3">빙고게임</h1>
            <div className="text-3xl font-bold text-app-pink-light">
              {bingoCount > 0 ? `🎉 ${bingoCount} BINGO! 🎉` : ''}
            </div>
          </div>
          {!roomParams.isObsMode && (
            <div className="text-left">
              <h2 className="mb-2 text-3xl font-bold text-app-pink-light">🎉 파티후원 메뉴</h2>
              <ul className="space-y-1 text-2xl text-app-white/80 list-none">
                <li>
                  랜덤 한 칸 초기화 10,000 <span aria-hidden="true">🧀</span>
                </li>
                <li>
                  랜덤 한 줄 초기화 20,000 <span aria-hidden="true">🧀</span>
                </li>
                <li>
                  전체 칸 뒤섞기 50,000 <span aria-hidden="true">🧀</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl w-full">
        <div className="grid grid-cols-4 gap-2 mb-6 bg-app-panel p-4 rounded-xl [&>button]:min-w-0">
          {boardMissionIds.map((missionId, index) => {
            const mission = missionById[missionId];
            const Icon = mission.icon;
            const isCompleted = completed.has(missionId);

            return (
              <button
                key={`${missionId}-${index}`}
                onClick={() => toggleCell(missionId)}
                disabled={!canToggleCells || status === 'loading'}
                className={`
                  relative w-full aspect-square overflow-hidden rounded-lg p-2
                  flex flex-col items-center justify-between
                  transition-all duration-300 border-4
                  ${!canToggleCells ? 'cursor-default' : ''}
                  ${isCompleted
                    ? 'bg-app-pink border-app-pink-light shadow-lg shadow-app-pink/50'
                    : 'bg-app-brown/40 border-app-brown hover:bg-app-brown/60 hover:border-app-pink-light'
                  }
                  ${canToggleCells && !isCompleted ? 'hover:scale-105' : ''}
                `}
              >
                <Icon
                  className={`w-12 h-12 shrink-0 ${isCompleted ? 'text-app-bg' : 'text-app-white'}`}
                  strokeWidth={2.5}
                />
                <span
                  className={`flex-1 flex items-center justify-center w-full min-h-0 px-0.5 text-2xl font-bold text-center leading-tight line-clamp-2 break-keep overflow-hidden ${isCompleted ? 'text-app-bg' : 'text-app-white'}`}
                >
                  {mission.text}
                </span>
                {isCompleted && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-2 h-full bg-app-bg rotate-45 rounded-full"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {showControls && (
          <div className="flex gap-3 flex-wrap justify-center">
            <button
              onClick={resetRandomCell}
              disabled={completed.size === 0 || status === 'loading'}
              className="px-6 py-3 bg-app-pink hover:bg-app-pink-light disabled:bg-app-brown/50 disabled:cursor-not-allowed text-app-bg font-semibold rounded-lg transition-colors shadow-lg"
            >
              랜덤 한 칸 초기화
            </button>
            <button
              onClick={resetRandomRow}
              disabled={status === 'loading'}
              className="px-6 py-3 bg-app-brown hover:bg-app-brown/80 text-app-white font-semibold rounded-lg transition-colors shadow-lg"
            >
              랜덤 한 줄 초기화
            </button>
            <button
              onClick={shuffleBoard}
              disabled={status === 'loading'}
              className="px-6 py-3 bg-app-panel border border-app-pink hover:border-app-pink-light text-app-pink-light font-semibold rounded-lg transition-colors shadow-lg"
            >
              전체 칸 섞기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
