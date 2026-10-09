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

// 指定学年カラー
const GRADE_COLORS = {
  '1年': 'bg-lime-100 text-lime-800 border-lime-300',
  '2年': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  '3年': 'bg-purple-100 text-purple-800 border-purple-300',
  '4年': 'bg-pink-100 text-pink-800 border-pink-300',
};

export default function Home() {
  const [activities, setActivities] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'mypage'
  const [selectedDate, setSelectedDate] = useState('');

  // カレンダー表示用年月ステート
  const [currentDate, setCurrentDate] = useState(new Date());

  // プロフィール情報 (localStorage)
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

  // 初期ロード：ローカルストレージとSupabaseデータの読み込み
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

  // プロフィール保存
  const handleSaveProfile = (e) => {
    e.preventDefault();
    localStorage.setItem('user_profile', JSON.stringify(profile));
    alert('プロフィールを保存しました！');
  };

  // マイページ情報リセット（初期化）
  const handleResetProfile = () => {
    if (confirm('マイページの入力情報を完全に削除して初期化しますか？')) {
      localStorage.removeItem('user_profile');
      setProfile({
        real_name: '',
        circle_name: '',
        student_id: '',
        grade: '1年',
        line_name: '',
        role: 'member',
      });
      alert('プロフィール情報をリセットしました。');
    }
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

  // 活動削除処理 (幹部・館付用)
  const handleDeleteActivity = async (activityId, title) => {
    if (!confirm(`「${title}」の活動募集を削除しますか？\n（参加者データも同時に削除されます）`)) return;

    // まず関連する参加者データを削除
    await supabase.from('participants').delete().eq('activity_id', activityId);

    // 活動本体を削除
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', activityId);

    if (error) {
      alert(`削除に失敗しました: ${error.message}`);
    } else {
      alert('活動募集を削除しました。');
      fetchData();
    }
  };

  // 参加表明処理
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

  // カレンダー計算ロジック
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // 各日付に活動があるかチェック
  const getActivityDatesSet = () => {
    const dates = new Set();
    activities.forEach((act) => {
      if (act.event_date) dates.add(act.event_date);
    });
    return dates;
  };
  const activeDatesSet = getActivityDatesSet();

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
          {/* 大枠のカレンダー（グリッドUI） */}
          <div className="bg-white border rounded-2xl p-4 shadow-sm mb-6">
            {/* 月切替ヘッダー */}
            <div className="flex justify-between items-center mb-4 px-2">
              <button
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700"
              >
                ◀ 前月
              </button>
              <h2 className="text-lg font-bold text-gray-800">
                {year}年 {month + 1}月
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-bold text-gray-700"
              >
                次月 ▶
              </button>
            </div>

            {/* 曜日ヘッダー */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-gray-500 mb-2">
              <span className="text-red-500">日</span>
              <span>月</span>
              <span>火</span>
              <span>水</span>
              <span>木</span>
              <span>金</span>
              <span className="text-blue-500">土</span>
            </div>

            {/* 日付マス目 */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* 月初めの空白 */}
              {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                <div key={`empty-${i}`} className="h-11 rounded-lg" />
              ))}

              {/* 日付ボタン */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const dayNum = i + 1;
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;
                const hasActivity = activeDatesSet.has(dateStr);

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDate(''); // 解除
                      } else {
                        setSelectedDate(dateStr);
                      }
                    }}
                    className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition ${
                      isSelected
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'bg-gray-50 hover:bg-blue-50 text-gray-800'
                    }`}
                  >
                    <span className="text-xs">{dayNum}</span>
                    {/* 活動がある日の目印ポチ */}
                    {hasActivity && (
                      <span
                        className={`w-1.5 h-1.5 rounded-full mt-0.5 ${
                          isSelected ? 'bg-white' : 'bg-blue-500'
                        }`}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* フィルター状態・解除ボタン */}
            {selectedDate && (
              <div className="mt-4 pt-3 border-t flex justify-between items-center text-xs">
                <span className="font-bold text-blue-700">
                  選択中: {selectedDate} ({filteredActivities.length}件の活動)
                </span>
                <button
                  onClick={() => setSelectedDate('')}
                  className="bg-gray-200 text-gray-700 px-3 py-1 rounded-lg font-bold hover:bg-gray-300"
                >
                  絞り込み解除（全件表示）
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-700">
              {selectedDate ? `${selectedDate} の活動` : '募集中の活動一覧'}
            </h2>
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
                    className="border rounded-xl p-4 bg-white shadow-sm hover:shadow transition relative"
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
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-full text-gray-600">
                          定員 {participantsList.length} / {act.capacity || 10}名
                        </span>
                        {/* 幹部・館付限定の活動削除ボタン */}
                        {profile.role === 'executive' && (
                          <button
                            onClick={() => handleDeleteActivity(act.id, act.title)}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-2 py-1 rounded-lg font-bold transition"
                            title="この活動募集を削除"
                          >
                            🗑️ 削除
                          </button>
                        )}
                      </div>
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

                    {/* 幹部・館付のみ参加者名簿（学年カラーバッジ・LINE名等）を表示 */}
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
                      /* 一般ユーザー向け */
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
                placeholder="例: 桜美林 太郎"
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
                  <option value="大学院・その他">大学院・その他</option>
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
                placeholder="例: 221A0000"
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

          {/* マイページ初期化ボタン */}
          <div className="mt-8 pt-4 border-t text-center">
            <button
              onClick={handleResetProfile}
              className="text-xs text-gray-400 hover:text-red-500 underline transition"
            >
              🗑️ マイページ情報をリセット（初期化）
            </button>
          </div>
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
                  placeholder="例: 週末ボランティア"
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
