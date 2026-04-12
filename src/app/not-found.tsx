import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-700 mb-6">الصفحة غير موجودة</h2>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. 
      </p>
      <Link href="/" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
        العودة للرئيسية
      </Link>
    </div>
  );
}
