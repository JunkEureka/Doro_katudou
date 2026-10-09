'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [userName, setUserName] = useState('');
  const [grade, setGrade] = useState('1年');
  const [lineName, setLineName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
    const savedName = localStorage.getItem('circle_user_name');
    const savedGrade = localStorage.getItem('circle_grade');
    const savedLine = localStorage.getItem('circle_line_name');
    if (savedName) setUserName(savedName);
    if (savedGrade) setGrade(savedGrade);
    if (savedLine) setLineName(savedLine);
  }, []);

  const fetchActivities = async () => {
    setLoading(true);
    const { data } = await supabase.from('activities').select('*').order('event_date', { ascending: true });
    setActivities(data || []);
    if (data && data.length > 0) {
      selectActivity(data[0].id, data[0]);
    } else {
      setLoading(false);
    }
  };

  const selectActivity = async (id, act) => {
    setSelectedActivity(act);
    const { data: part } = await supabase
      .from('participants')
      .select('*')
      .eq('activity_id', id)
      .order('created_at', { ascending: true });

    setParticipants(part || []);
    const currentSavedName = localStorage.getItem('circle_user_name');
    if (currentSavedName && part) {
      setIsJoined(part.some((p) => p.user_name === currentSavedName));
    } else {
      setIsJoined(false);
    }
    setLoading(false);
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!userName || !lineName) {
      alert('名前とLINE表示名を入力してください');
      return;
    }

    localStorage.setItem('circle_user_name', userName);
    localStorage.setItem('circle_grade', grade);
    localStorage.setItem('circle_line_name', lineName);

    const { error } = await supabase.from('participants').insert([
      { activity_id: selectedActivity.id, user_name: userName, grade, line_name: lineName }
    ]);

    if (error) {
      alert('登録に失敗しました（既に登録済みの可能性があります）');
    } else {
      fetchActivities();
    }
  };

  const handleCancel = async () => {
    if (!confirm('本当にキャンセルしますか？')) return;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('activity_id', selectedActivity.id)
      .eq('user_name', userName);

    if (error) {
      alert('キャンセル処理に失敗しました');
    } else {
      fetchActivities();
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">読み込み中...</div>;

  return (
    <div className="max-w-md mx-auto p-4 space-y-4 font-sans">
      <header className="bg-blue-600 text-white p-4 rounded-lg shadow text-center">
        <h1 className="text-xl font-bold">サークル活動募集</h1>
      </header>

      {activities.length === 0 ? (
        <div className="bg-white p-6 rounded-lg text-center text-gray-500 shadow">
          現在、募集中の活動はありません
        </div>
      ) : (
        <>
          <div className="bg-white p-4 rounded-lg shadow space-y-2">
            <label className="block text-xs text-gray-500 font-bold">活動を選択</label>
            <select
              className="w-full border p-2 rounded text-sm bg-gray-50"
              onChange={(e) => {
                const act = activities.find((a) => a.id === e.target.value);
                if (act) selectActivity(act.id, act);
              }}
              value={selectedActivity?.id || ''}
            >
              {activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.event_date} - {a.title} ({a.site_name})
                </option>
              ))}
            </select>
          </div>

          {selectedActivity && (
            <>
              <div className="bg-white p-4 rounded-lg shadow space-y-2">
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-bold">
                  {selectedActivity.site_name}
                </span>
                <h2 className="text-lg font-bold mt-1">{selectedActivity.title}</h2>
                <p className="text-sm text-gray-600">📅 {selectedActivity.event_date} {selectedActivity.start_time}</p>
                <p className="text-sm text-gray-600">📍 {selectedActivity.location}</p>
                <p className="text-sm text-gray-700 border-t pt-2 mt-2">{selectedActivity.description}</p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow flex justify-between items-center">
                <div>
                  <span className="text-xs text-gray-500">募集状況</span>
                  <p className="text-lg font-bold">{selectedActivity.current_count} / {selectedActivity.capacity} 名</p>
                </div>
                {selectedActivity.current_count >= selectedActivity.capacity ? (
                  <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full font-bold">満員</span>
                ) : (
                  <span className="bg-green-500 text-white text-xs px-3 py-1 rounded-full font-bold">募集中</span>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow">
                {isJoined ? (
                  <div className="space-y-3">
                    <p className="text-green-600 font-bold text-center text-sm">✓ 参加登録済みです</p>
                    <button
                      onClick={handleCancel}
                      className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded text-sm hover:bg-gray-300"
                    >
                      参加をキャンセルする
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleJoin} className="space-y-3">
                    <h3 className="font-bold text-sm">参加登録フォーム</h3>
                    <div>
                      <label className="block text-xs text-gray-500">サークル内の名前</label>
                      <input
                        type="text"
                        required
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="例：山田 太郎"
                        className="w-full border p-2 rounded text-sm mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">学年</label>
                      <select
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="w-full border p-2 rounded text-sm mt-1"
                      >
                        <option>1年</option>
                        <option>2年</option>
                        <option>3年</option>
                        <option>4年</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500">LINE表示名（グループ照合用）</label>
                      <input
                        type="text"
                        required
                        value={lineName}
                        onChange={(e) => setLineName(e.target.value)}
                        placeholder="例：taro_line"
                        className="w-full border p-2 rounded text-sm mt-1"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={selectedActivity.current_count >= selectedActivity.capacity}
                      className={`w-full text-white font-bold py-2 rounded text-sm ${
                        selectedActivity.current_count >= selectedActivity.capacity
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {selectedActivity.current_count >= selectedActivity.capacity ? '満員のため受付終了' : '参加する'}
                    </button>
                  </form>
                )}
              </div>

              <div className="bg-white p-4 rounded-lg shadow space-y-2">
                <h3 className="font-bold text-sm">参加者一覧 ({participants.length}名)</h3>
                {participants.length === 0 ? (
                  <p className="text-xs text-gray-400">まだ参加者はいません</p>
                ) : (
                  <ul className="divide-y text-sm">
                    {participants.map((p) => (
                      <li key={p.id} className="py-2 flex justify-between">
                        <span>{p.user_name}</span>
                        <span className="text-gray-500 text-xs">{p.grade}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
