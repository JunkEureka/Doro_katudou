import './globals.css';

export const metadata = {
  title: 'サークル活動募集',
  description: 'サークルの活動募集・参加管理サイト',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <body className="bg-gray-100 min-h-screen text-gray-900">{children}</body>
    </html>
  );
}
