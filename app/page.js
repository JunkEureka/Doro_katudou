'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 15個の活動先リスト（実際の活動先名に変更可能です）
const SITE_LIST = [
  'ありんこ', '一ノ宮', '押立', '片町', '上田',
  '是政', '桜まつり', '新町', '神明', '白糸',
  '多摩境', '南平', '紅葉', '由木', '四谷'
];

export default function Home() {
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'mypage'
  const [activities, setActivities] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showAddModal, setShowAddModal] = useState(false);

  // 新規活動フォーム
  const [newActivity, setNewActivity] = useState({
    title: '',
    site_name: SITE_LIST[0],
    event_date: '',
    start_time: '10:00',
    location: '',
    description: '',
    capacity: 10
  });

  // プロフィール情報
  const [profile, setProfile] = useState({
    realName: '',
    studentId: '',
    userName: '',
    lineName: '',
    grade: '1年',
    role: '一般メンバー'
  });

  // 学年カラー設定
  const gradeColors = {
    '1年': 'bg-lime-500 text-white',
    '2年': 'bg-yellow-400 text-gray-900',
    '3年': 'bg-purple-600 text-white',
    '4年': 'bg-pink-500 text-white',
  };

  useEffect(() => {
    const saved = {
      realName: localStorage.getItem('circle_real_name') || '',
      studentId: localStorage.getItem('circle_student_id') || '',
      userName: localStorage.getItem('circle_user_name') || '',
      lineName: localStorage.getItem('circle_line_name') || '',
      grade: localStorage.getItem('circle_grade') || '1年',
      role: localStorage.getItem('circle_role') || '一般メンバー',
    };
    setProfile(saved);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: actData } = await supabase.from('activities').select('*').order('event_date', { ascending: true });
    const { data: partData } = await supabase.from('participants').select('*');
    setActivities(actData || []);
    setParticipants(partData || []);
    setLoading(false);
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    localStorage.setItem('circle_real_name', profile.realName);
    localStorage.setItem('circle_student_id', profile.studentId);
    localStorage.setItem('circle_user_name', profile.userName);
    localStorage.setItem('circle_line_name', profile.lineName);
    localStorage.setItem('circle_grade', profile.grade);
    localStorage.setItem('circle_role', profile.role);
    alert('プロフィールを保存しました！');
  };

  const handleCreateActivity = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('activities').insert([newActivity]);
    if (error) {
      alert('活動の登録に失敗しました');
    } else {
      alert('新しい活動を登録しました！');
      setShowAddModal(false);
      setNewActivity({
        title: '',
        site_name: SITE_LIST[0],
        event_date: '',
        start_time: '10:00',
        location: '',
        description: '',
        capacity: 10
      });
      fetchData();
    }
  };

  const handleDeleteActivity = async (actId) => {
    if (!confirm('この活動を削除しますか？')) return;
    const { error } = await supabase.from('activities').delete().eq('id', actId);
    if (error) {
      alert('削除に失敗しました');
    } else {
      setSelectedActivity(null);
      fetchData();
    }
  };

  const handleJoin = async (actId) => {
    if (!profile.userName || !profile.lineName) {
      alert('先にマイページでプロフィールを登録してください');
      setActiveTab('mypage');
      return;
    }

    const { error } = await supabase.from('participants').insert([
      {
        activity_id: actId,
        user_name: profile.userName,
        grade: profile.grade,
        line_name: profile.lineName,
        real_name: profile.realName,
        student_id: profile.studentId
      }
    ]);

    if (error) {
      alert('登録に失敗しました');
    } else {
      fetchData();
    }
  };

  const handleCancel = async (actId) => {
    if (!confirm('本当にキャンセルしますか？')) return;
    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('activity_id', actId)
      .eq('user_name', profile.userName);

    if (error) {
      alert('キャンセルに失敗しました');
    } else {
      fetchData();
    }
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const myJoinedActivities = activities.filter(act => 
    participants.some(p => p.activity_id === act.id && p.user_name === profile.userName)
  );

  const isAdmin = profile.role === '幹部・管理者';

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gray-50 flex flex-col font-sans pb-10">
      <header className="bg-blue-600 text-white p-4 text-center font-bold text-lg shadow flex justify-between items-center">
        <span>サークル活動ポータル</span>
        {isAdmin && (
          <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded font-bold">管理者権限</span>
        )}
      </header>

      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'calendar' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          📅 カレンダー
        </button>
        <button
          onClick={() => setActiveTab('mypage')}
          className={`flex-1 py-3 text-center text-sm font-bold ${activeTab === 'mypage' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
        >
          👤 マイページ
        </button>
      </div>

      <div className="p-4 flex-1">
        {loading ? (
          <div className="text-center py-10 text-gray-400">読み込み中...</div>
        ) : activeTab === 'calendar' ? (
          <div className="space-y-4">
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl shadow text-sm flex items-center justify-center gap-1"
              >
                ＋ 新しい活動を募集する
              </button>
            )}

            <div className="bg-white p-4 rounded-xl shadow">
              <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-2 text-gray-600 font-bold">&lt;</button>
                <h2 className="text-base font-bold">{year}年 {month + 1}月</h2>
                <button onClick={nextMonth} className="p-2 text-gray-600 font-bold">&gt;</button>
              </div>

              <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-gray-400 mb-2">
                <span className="text-red-500">日</span><span>月</span><span>火</span><span>水</span><span>木</span><span>金</span><span className="text-blue-500">土</span>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-12"></div>
                ))}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayActs = activities.filter(a => a.event_date === dateStr);

                  return (
                    <div
                      key={day}
                      className="h-12 border rounded-lg p-1 flex flex-col justify-between items-center bg-white hover:bg-blue-50 cursor-pointer relative"
                      onClick={() => dayActs.length > 0 && setSelectedActivity(dayActs[0])}
                    >
                      <span className="text-xs font-semibold">{day}</span>
                      {dayActs.length > 0 && (
                        <div className="w-full bg-blue-500 text-white text-[9px] rounded truncate px-0.5 mt-0.5">
                          {dayActs[0].title}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="text-xs text-gray-400 text-center">※ 日程をタップすると詳細が表示されます</div>
          </div>
        ) : (
          <div className="space-y-6">
            <form onSubmit={handleProfileSave} className="bg-white p-4 rounded-xl shadow space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="font-bold text-sm">プロフィール設定</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${gradeColors[profile.grade]}`}>
                  {profile.grade}
                </span>
              </div>
              <div>
                <label className="text-xs text-gray-500">本名</label>
                <input
                  type="text"
                  value={profile.realName}
                  onChange={e => setProfile({ ...profile, realName: e.target.value })}
                  placeholder="例：山田 太郎"
                  className="w-full border p-2 rounded text-sm mt-0.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">学籍番号</label>
                <input
                  type="text"
                  value={profile.studentId}
                  onChange={e => setProfile({ ...profile, studentId: e.target.value })}
                  placeholder="例：A1234567"
                  className="w-full border p-2 rounded text-sm mt-0.5"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">サークル内での名前</label>
                <input
                  type="text"
                  value={profile.userName}
                  onChange={e => setProfile({ ...profile, userName: e.target.value })}
                  placeholder="例：たろう"
                  className="w-full border p-2 rounded text-sm mt-0.5"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">LINE表示名</label>
                <input
                  type="text"
                  value={profile.lineName}
                  onChange={e => setProfile({ ...profile, lineName: e.target.value })}
                  placeholder="例：taro_line"
                  className="w-full border p-2 rounded text-sm mt-0.5"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">学年</label>
                <select
                  value={profile.grade}
                  onChange={e => setProfile({ ...profile, grade: e.target.value })}
                  className="w-full border p-2 rounded text-sm mt-0.5"
                >
                  <option value="1年">1年（黄緑）</option>
                  <option value="2年">2年（黄色）</option>
                  <option value="3年">3年（紫）</option>
                  <option value="4年">4年（ピンク）</option>
                </select>
              </div>
              <div className="pt-2 border-t">
                <label className="text-xs font-bold text-blue-600">役職（権限設定）</label>
                <select
                  value={profile.role}
                  onChange={e => setProfile({ ...profile, role: e.target.value })}
                  className="w-full border p-2 rounded text-sm mt-0.5 font-bold bg-blue-50"
                >
                  <option value="一般メンバー">一般メンバー（参加のみ）</option>
                  <option value="幹部・管理者">幹部・管理者（活動の追加・削除が可能）</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded text-sm mt-2">
                プロフィールを保存する
              </button>
            </form>

            <div className="bg-white p-4 rounded-xl shadow space-y-3">
              <h3 className="font-bold text-sm">参加予定の活動 ({myJoinedActivities.length}件)</h3>
              {myJoinedActivities.length === 0 ? (
                <p className="text-xs text-gray-400">参加予定の活動はありません</p>
              ) : (
                <div className="space-y-2">
                  {myJoinedActivities.map(act => (
                    <div key={act.id} className="border p-3 rounded-lg flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-sm">{act.title}</p>
                        <p className="text-gray-500">📅 {act.event_date} {act.start_time}</p>
                      </div>
                      <button
                        onClick={() => handleCancel(act.id)}
                        className="bg-gray-200 text-gray-700 px-3 py-1 rounded font-bold"
                      >
                        キャンセル
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-3 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b pb-2">
              <h3 className="font-bold text-base">新しい活動を募集</h3>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 font-bold text-lg">×</button>
            </div>
            <form onSubmit={handleCreateActivity} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-gray-600">活動先サイト名</label>
                <select
                  value={newActivity.site_name}
                  onChange={e => setNewActivity({ ...newActivity, site_name: e.target.value })}
                  className="w-full border p-2 rounded mt-1 bg-white"
                >
                  {SITE_LIST.map((site, i) => (
                    <option key={i} value={site}>{site}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-gray-600">活動タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例：週末ボランティア活動"
                  value={newActivity.title}
                  onChange={e => setNewActivity({ ...newActivity, title: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="font-bold text-gray-600">活動日</label>
                  <input
                    type="date"
                    required
                    value={newActivity.event_date}
                    onChange={e => setNewActivity({ ...newActivity, event_date: e.target.value })}
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
                <div className="w-28">
                  <label className="font-bold text-gray-600">開始時間</label>
                  <input
                    type="time"
                    required
                    value={newActivity.start_time}
                    onChange={e => setNewActivity({ ...newActivity, start_time: e.target.value })}
                    className="w-full border p-2 rounded mt-1"
                  />
                </div>
              </div>
              <div>
                <label className="font-bold text-gray-600">集合場所</label>
                <input
                  type="text"
                  required
                  placeholder="例：駅前ロータリー"
                  value={newActivity.location}
                  onChange={e => setNewActivity({ ...newActivity, location: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600">募集人数（定員）</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newActivity.capacity}
                  onChange={e => setNewActivity({ ...newActivity, capacity: parseInt(e.target.value) })}
                  className="w-full border p-2 rounded mt-1"
                />
              </div>
              <div>
                <label className="font-bold text-gray-600">詳細説明</label>
                <textarea
                  rows="3"
                  placeholder="持ち物や注意事項など"
                  value={newActivity.description}
                  onChange={e => setNewActivity({ ...newActivity, description: e.target.value })}
                  className="w-full border p-2 rounded mt-1"
                ></textarea>
              </div>
              <button type="submit" className="w-full bg-green-600 text-white font-bold py-2.5 rounded shadow">
                この内容で募集を開始する
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-sm space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b pb-2">
              <div>
                <span className="text-xs text-blue-600 font-bold">{selectedActivity.site_name}</span>
                <h3 className="font-bold text-base mt-0.5">{selectedActivity.title}</h3>
              </div>
              <button onClick={() => setSelectedActivity(null)} className="text-gray-400 font-bold text-lg">×</button>
            </div>

            <div className="text-xs text-gray-600 space-y-1">
              <p>📅 日時: {selectedActivity.event_date} {selectedActivity.start_time}</p>
              <p>📍 集合場所: {selectedActivity.location}</p>
              <p className="pt-1 text-gray-800">{selectedActivity.description}</p>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>募集状況</span>
                <span>{selectedActivity.current_count} / {selectedActivity.capacity} 名</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full transition-all duration-300"
                  style={{ width: `${Math.min(100, (selectedActivity.current_count / selectedActivity.capacity) * 100)}%` }}
                ></div>
              </div>
            </div>

            {participants.some(p => p.activity_id === selectedActivity.id && p.user_name === profile.userName) ? (
              <button
                onClick={() => { handleCancel(selectedActivity.id); setSelectedActivity(null); }}
                className="w-full bg-gray-200 text-gray-700 font-bold py-2 rounded text-sm"
              >
                参加をキャンセルする
              </button>
            ) : (
              <button
                onClick={() => { handleJoin(selectedActivity.id); setSelectedActivity(null); }}
                disabled={selectedActivity.current_count >= selectedActivity.capacity}
                className={`w-full text-white font-bold py-2 rounded text-sm ${
                  selectedActivity.current_count >= selectedActivity.capacity
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600'
                }`}
              >
                {selectedActivity.current_count >= selectedActivity.capacity ? '満員です' : '参加表明する'}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => handleDeleteActivity(selectedActivity.id)}
                className="w-full bg-red-100 text-red-600 font-bold py-1.5 rounded text-xs"
              >
                🗑 この活動を削除（管理者機能）
              </button>
            )}

            <div className="border-t pt-3">
              <h4 className="font-bold text-xs mb-2">参加者一覧</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {participants.filter(p => p.activity_id === selectedActivity.id).length === 0 ? (
                  <p className="text-xs text-gray-400">まだ参加者はいません</p>
                ) : (
                  participants
                    .filter(p => p.activity_id === selectedActivity.id)
                    .map(p => (
                      <div key={p.id} className="flex justify-between items-center text-xs bg-gray-50 p-2 rounded">
                        <span>{p.user_name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${gradeColors[p.grade] || 'bg-gray-200'}`}>
                          {p.grade}
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
