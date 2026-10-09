export const metadata = {
  title: 'サークル活動ポータル',
  description: 'サークル活動の募集・参加管理サイト',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-100 min-h-screen text-gray-900 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
