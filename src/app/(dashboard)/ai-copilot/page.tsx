'use client';

export default function AICopilotPage() {
    return (
        <div className="p-6 max-w-4xl mx-auto space-y-6 flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-32 h-32 bg-purple-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                <span className="text-6xl">🤖</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-800">الوكيل المساعد (AI Copilot)</h1>
            <p className="text-xl text-gray-500 max-w-2xl">
                سيعمل هذا الوكيل الآلي كمحاسب ومساعد إداري خاص بك.
                <br/><br/>
                <b>لست بحاجة لفتح صفحة خاصة به!</b><br/>
                انظر في الأسفل (يمين الشاشة)، ستجد الزر البنفسجي العائم جاهزاً لمساعدتك في أي لحظة وبأي صفحة داخل النظام.
            </p>
            <div className="animate-bounce mt-8 p-4 bg-purple-50 rounded-2xl text-purple-600 font-medium">
                اضغط على الزر العائم في الأسفل للبدء 👇
            </div>
        </div>
    );
}
