import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { fetchAllNikeActivities, nikeActivityToPath } from '../lib/nike';
import GlobeScene from '../components/three/GlobeScene';
import ActivityList from '../components/ActivityList';
import type { RunningPath } from '../types/strava';

export default function RunningMap() {
  const navigate = useNavigate();
  const { nikeToken, paths, setPaths, isCached, isLoading, setLoading } = useStore();
  const [showRefreshGuide, setShowRefreshGuide] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingTotal, setLoadingTotal] = useState(0);

  useEffect(() => {
    if (paths.length > 0) return; // 이미 로딩됨 (캐시 포함)

    const envRaw = import.meta.env.VITE_NIKE_TOKEN;
    const envToken = envRaw ? envRaw.replace(/^Bearer\s+/i, '') : null;
    const token = nikeToken || envToken;

    if (!token) {
      navigate('/', { replace: true });
      return;
    }

    loadFromNike(token);
  }, []);

  async function loadFromNike(token: string) {
    setLoading(true);
    setLoadingMsg('Nike Run Club에서 기록을 가져오는 중...');
    try {
      const activities = await fetchAllNikeActivities(token);
      setLoadingTotal(activities.length);
      setLoadingMsg(`${activities.length}개 러닝 발견! GPS 경로 불러오는 중...`);

      const newPaths: RunningPath[] = [];
      for (let i = 0; i < activities.length; i++) {
        setLoadingProgress(i + 1);
        const path = await nikeActivityToPath(token, activities[i]);
        if (path) newPaths.push(path);
      }
      setPaths(newPaths);
    } catch {
      setLoadingMsg('토큰이 만료되었습니다. 다시 연결해주세요.');
      setTimeout(() => navigate('/', { replace: true }), 2000);
    } finally {
      setLoading(false);
    }
  }

  if (isLoading) {
    const percent = loadingTotal > 0 ? Math.round((loadingProgress / loadingTotal) * 100) : 0;
    return (
      <div className="loading-page">
        <div className="loading-stars" />
        <div className="loading-content">
          <div className="loading-runner">
            <div className="runner-track">
              <div className="runner-dot" />
              <div className="runner-dot" />
              <div className="runner-dot" />
            </div>
            <div className="runner-figure">🏃</div>
          </div>
          <h1 className="loading-title">러닝 맵을 구성하는 중...</h1>
          <p className="loading-msg">{loadingMsg}</p>
          {loadingTotal > 0 && (
            <>
              <div className="loading-bar">
                <div className="loading-fill" style={{ width: `${percent}%` }} />
              </div>
              <p className="loading-percent">{loadingProgress} / {loadingTotal} ({percent}%)</p>
            </>
          )}
        </div>
      </div>
    );
  }

  function handleRefresh() {
    setShowRefreshGuide(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="map-page">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2 className="map-title">My Running Map</h2>
        </div>
        {paths.length > 0 && (
          <button onClick={() => navigate('/tickets')} className="boarding-pass-btn">
            <span className="boarding-pass-icon">✈</span>
            Boarding Passes
          </button>
        )}
        {isCached && (
          <div className="refresh-notice">
            <p className="refresh-notice-text">
              저장된 데이터로 표시 중입니다.
            </p>
            <button onClick={() => setShowRefreshGuide(true)} className="refresh-notice-link">
              새 러닝 기록 갱신하기 →
            </button>
          </div>
        )}
        {showRefreshGuide && (
          <div className="refresh-guide">
            <p className="refresh-guide-text">
              Nike 토큰을 다시 입력하면 최신 러닝 기록으로 갱신됩니다.
            </p>
            <div className="refresh-guide-actions">
              <button onClick={handleRefresh} className="refresh-guide-btn">
                토큰 다시 입력하기
              </button>
              <button onClick={() => setShowRefreshGuide(false)} className="refresh-guide-cancel">
                취소
              </button>
            </div>
          </div>
        )}
        <ActivityList paths={paths} />
      </div>
      <div className="main-content">
        <div className="map-area">
          <GlobeScene paths={paths} />
        </div>
      </div>
    </div>
  );
}
