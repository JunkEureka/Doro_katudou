'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 活動先のリスト（全15箇所）
const SITE_LIST = [
  'ありんこ',
  '一ノ宮',
  '押立',
  '片町',
  '上田',
  '是政',
  '桜まつり',
  '新町',
  '神明',
  '白糸',
  '多摩境',
  '南平',
  '紅葉',
  '由木',
  '四谷'
];

// 学年カラー定義 (指定カラー)
const GRADE_COLORS = {
  '1年': 'bg-lime-100 text-lime-800 border-lime-300',
  '2年': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '3年': 'bg-purple-100 text-purple-800 border-purple-300',
  '4年': 'bg-pink-100 text-pink-800 border-pink-300',
  '大学院・その他': 'bg-gray-100 text-gray-700 border-gray-300',
};

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'mypage'
  const [selectedDate, setSelectedDate] = useState('');

  // プロフィール情報 (localStorageで端末保存)
  const [profile, setProfile] = useState({
    real_name: '',
    circle_name: '',
    student_id: '',
    grade: '1年',
    line_name: '',
    role: 'member', // 'member': 一般, 'executive': 幹部・館付
  });

  // 新規活動入力データ
  const [newActivity, setNewActivity] = useState({
    title: '',
    site_name: SITE_LIST[0],
    event_date: '',
    start_time: '10:00',
    location: '',
    description: '',
    capacity: 10,
  });

  // 初期ロード：ローカルストレージからのプロフィール読み込み ＆ Supabaseデータ取得
  useEffect(() => {
    const savedProfile = localStorage.getItem('user_profile');
    if (savedProfile) {
      try {
        setProfile((prev) => ({ ...prev, ...JSON.parse(savedProfile) }));
      } catch (e) {
        console.error('Failed to parse profile', e);
      }
    }
    fetchData();
  }, []);

  // データ取得
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('activities')
      .select('*, participants(*)');

    if (error) {
      console.error('Error fetching data:', error);
    } else {
      setActivities(data || []);
    }
  };

  // プロフィール保存 (localStorageに保持)
  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    alert('プロフィールを保存しました！');
  };

  // 新規活動登録 (幹部・館付用)
  const handleCreateActivity = async (e) => {
    e.preventDefault();
    const { data, error } = await supabase
      .from('activities')
      .insert([newActivity]);

    if (error) {
      alert(`登録エラー詳細: ${error.message}`);
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
        capacity: 10,
      });
      fetchData();
    }
  };

  // 参加表明処理 (マイページの保存データを送信)
  const handleJoin = async (activityId) => {
    if (!profile.line_name || !profile.real_name) {
      alert('参加するにはマイページで本名とLINE表示名を登録して保存してください。');
      setActiveTab('mypage');
      return;
    }

    const { error } = await supabase.from('participants').insert([
      {
        activity_id: activityId,
        real_name: profile.real_name,
        circle_name: profile.circle_name,
        student_id: profile.student_id,
        grade: profile.grade,
        line_name: profile.line_name,
      },
    ]);

    if (error) {
      alert(`参加登録に失敗しました: ${error.message}`);
    } else {
      alert('参加登録が完了しました！');
      fetchData();
    }
  };

  // 参加キャンセル処理
  const handleCancelJoin = async (participantId) => {
    if (!confirm('参加をキャンセルしますか？')) return;

    const { error } = await supabase
      .from('participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      alert(`キャンセルに失敗しました: ${error.message}`);
    } else {
      alert('参加をキャンセルしました。');
      fetchData();
    }
  };

  // 日付フィルター処理
  const filteredActivities = selectedDate
    ? activities.filter((act) => act.event_date === selectedDate)
    : activities;

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20 font-sans">
      {/* ヘッダー */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b">
        <h1 className="text-xl font-bold text-gray-800">サークル活動募集</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'calendar'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            カレンダー・活動一覧
          </button>
          <button
            onClick={() => setActiveTab('mypage')}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              activeTab === 'mypage'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600'
            }`}
          >
            マイページ
          </button>
        </div>
      </header>

      {/* メインコンテンツ */}
      {activeTab === 'calendar' ? (
        <div>
          {/* 大枠のカレンダー・日付選択エリア（メイン画面の最上部） */}
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-6 shadow-sm">
            <h2 className="text-base font-bold text-blue-900 mb-2 flex items-center gap-2">
              📅 活動カレンダー選択
            </h2>
            <p className="text-xs text-blue-700 mb-4">
              日付を選択すると、その日に開催予定の活動を絞り込んで表示します。
            </p>
            <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-blue-100 shadow-inner">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="p-2 border rounded-lg text-base font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
              />
              {selectedDate && (
                <button
                  onClick={() => setSelectedDate('')}
                  className="whitespace-nowrap text-xs bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg font-bold hover:bg-gray-300 transition"
                >
                  全件表示に戻す
                </button>
              )}
            </div>
            {selectedDate && (
              <p className="text-xs font-bold text-blue-800 mt-3 bg-white/80 py-1 px-3 rounded-full inline-block">
                🔍 {selectedDate} の活動を表示中（全 {filteredActivities.length} 件）
              </p>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700">募集中の活動</h2>
            {profile.role === 'executive' && (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-green-600 text-white text-sm px-3 py-2 rounded-lg font-bold shadow hover:bg-green-700 transition"
              >
                ＋ 活動を新規登録
              </button>
            )}
          </div>

          {/* 活動カード一覧 */}
          <div className="space-y-4">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border">
                <p className="text-gray-500 text-sm">
                  {selectedDate
                    ? `${selectedDate} に募集中の活動はありません。`
                    : '現在募集中の活動はありません。'}
                </p>
              </div>
            ) : (
              filteredActivities.map((act) => {
                const participantsList = act.participants || [];
                const myParticipantObj = participantsList.find(
                  (p) =>
                    p.line_name === profile.line_name &&
                    p.real_name === profile.real_name
                );
                const isJoined = !!myParticipantObj;

                return (
                  <div
                    key={act.id}
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow transition"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2.5 py-1 rounded-md font-bold mr-2">
                          {act.site_name}
                        </span>
                        <h3 className="text-lg font-bold text-gray-900 mt-1">
                          {act.title}
                        </h3>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-full text-gray-600">
                        定員 {participantsList.length} / {act.capacity || 10}名
                      </span>
                    </div>

                    <p className="text-sm text-gray-600 mt-2 font-medium">
                      📅 {act.event_date} {act.start_time && `(${act.start_time}〜)`}
                    </p>
                    {act.location && (
                      <p className="text-sm text-gray-600">📍 {act.location}</p>
                    )}
                    {act.description && (
                      <p className="text-sm text-gray-500 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                        {act.description}
                      </p>
                    )}

                    {/* 幹部・館付のみ参加者名簿（LINE名・学籍番号・学年カラー）を表示 */}
                    {profile.role === 'executive' ? (
                      <div className="mt-4 p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-sm">
                        <h4 className="font-bold text-blue-900 mb-2 text-xs flex justify-between items-center">
                          <span>👥 参加者名簿（幹部・館付限定表示）</span>
                          <span>計 {participantsList.length}名</span>
                        </h4>
                        {participantsList.length > 0 ? (
                          <ul className="divide-y divide-gray-200">
                            {participantsList.map((p) => {
                              const gradeColor =
                                GRADE_COLORS[p.grade] ||
                                'bg-gray-100 text-gray-700 border-gray-200';
                              return (
                                <li
                                  key={p.id}
                                  className="py-2 flex justify-between items-center text-xs"
                                >
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    {/* 学年カラーバッジ */}
                                    <span
                                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeColor}`}
                                    >
                                      {p.grade || '未指定'}
                                    </span>
                                    <span className="font-bold text-gray-800">
                                      {p.real_name || '名前未登録'}
                                    </span>
                                    {p.circle_name && (
                                      <span className="text-gray-500">
                                        （{p.circle_name}）
                                      </span>
                                    )}
                                    <span className="text-gray-500 text-[11px]">
                                      学籍: {p.student_id || '未入力'}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                                      LINE: {p.line_name || '未設定'}
                                    </span>
                                  </div>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="text-gray-400 text-xs py-1">
                            まだ参加者はいません
                          </p>
                        )}
                      </div>
                    ) : (
                      /* 一般ユーザー向け表示 */
                      <div className="mt-3 text-xs text-gray-500">
                        現在の参加者数: {participantsList.length}名
                      </div>
                    )}

                    {/* 参加・キャンセルボタン */}
                    <div className="mt-4 pt-3 border-t flex justify-end">
                      {isJoined ? (
                        <button
                          onClick={() => handleCancelJoin(myParticipantObj.id)}
                          className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm font-bold border border-red-200 hover:bg-red-100 transition"
                        >
                          参加をキャンセルする
                        </button>
                      ) : (
                        <button
                          onClick={() => handleJoin(act.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-700 shadow transition"
                        >
                          この活動に参加する
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* マイページ画面 */
        <div className="bg-white p-6 border rounded-xl shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4">マイページ設定</h2>
          <p className="text-xs text-gray-500 mb-6">
            ※入力情報は端末（ブラウザ）に保存され、活動参加時に自動送信されます。
          </p>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                本名（フルネーム）
              </label>
              <input
                type="text"
                required
                placeholder="例: 山田 太郎"
                value={profile.real_name}
                onChange={(e) =>
                  setProfile({ ...profile, real_name: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                サークル内での名前（ニックネーム）
              </label>
              <input
                type="text"
                placeholder="例: たろー"
                value={profile.circle_name}
                onChange={(e) =>
                  setProfile({ ...profile, circle_name: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                学年（指定カラー適用）
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={profile.grade}
                  onChange={(e) =>
                    setProfile({ ...profile, grade: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="1年">1年（黄緑）</option>
                  <option value="2年">2年（黄色）</option>
                  <option value="3年">3年（紫）</option>
                  <option value="4年">4年（ピンク）</option>
                </select>
                <span
                  className={`text-xs font-bold px-2.5 py-1 rounded border whitespace-nowrap ${
                    GRADE_COLORS[profile.grade] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {profile.grade}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                学籍番号
              </label>
              <input
                type="text"
                placeholder="例: 00A0-000"
                value={profile.student_id}
                onChange={(e) =>
                  setProfile({ ...profile, student_id: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                LINEの表示名（グループ招待に使用）
              </label>
              <input
                type="text"
                required
                placeholder="例: たろう"
                value={profile.line_name}
                onChange={(e) =>
                  setProfile({ ...profile, line_name: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                権限設定
              </label>
              <select
                value={profile.role}
                onChange={(e) =>
                  setProfile({ ...profile, role: e.target.value })
                }
                className="w-full p-2 border rounded-lg text-sm bg-white"
              >
                <option value="member">一般メンバー</option>
                <option value="executive">幹部・館付（作成・名簿閲覧可）</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm shadow hover:bg-blue-700 mt-4 transition"
            >
              設定を保存する
            </button>
          </form>
        </div>
      )}

      {/* モーダル：新規活動登録 (幹部・館付用) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-gray-800 mb-4">新規活動の登録</h3>
            <form onSubmit={handleCreateActivity} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">活動タイトル</label>
                <input
                  type="text"
                  required
                  placeholder="例: 夏祭り"
                  value={newActivity.title}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, title: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">活動先名</label>
                <select
                  value={newActivity.site_name}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, site_name: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm bg-white"
                >
                  {SITE_LIST.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">開催日</label>
                <input
                  type="date"
                  required
                  value={newActivity.event_date}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, event_date: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">集合場所</label>
                <input
                  type="text"
                  placeholder="例: XX駅 東口改札前"
                  value={newActivity.location}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, location: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">定員（人数）</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={newActivity.capacity}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, capacity: parseInt(e.target.value) || 10 })
                  }
                  className="w-full p-2 border rounded text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">詳細説明</label>
                <textarea
                  placeholder="持ち物や注意事項など"
                  value={newActivity.description}
                  onChange={(e) =>
                    setNewActivity({ ...newActivity, description: e.target.value })
                  }
                  className="w-full p-2 border rounded text-sm h-20"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="w-1/2 bg-gray-200 text-gray-700 font-bold py-2 rounded text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="w-1/2 bg-green-600 text-white font-bold py-2 rounded text-sm"
                >
                  登録する
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
