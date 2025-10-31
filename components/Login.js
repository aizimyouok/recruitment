// 로그인 컴포넌트 (Google 로그인 버튼)
const Login = ({ onLogin }) => {
    const { useState } = React;
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleGoogleLogin = async () => {
        setError('');
        setLoading(true);
        try {
            // 'auth'와 'firebase'는 index.html의 initFirebase에서 초기화되어 전역에서 접근 가능합니다.
            const provider = new firebase.auth.GoogleAuthProvider();
            await auth.signInWithPopup(provider);
            onLogin();
        } catch (err) {
            setError('로그인 실패: ' + err.message);
            console.error("Google Login Error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
                <h1 className="text-3xl font-bold text-gray-800 mb-8">
                    채용 현황 관리 시스템
                </h1>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-all shadow-md disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                    {/* Icon 컴포넌트는 index.html에서 먼저 로드되어 사용 가능합니다. */}
                    <Icon name="google" size={20} />
                    <span>
                        {loading ? '로그인 중...' : 'Google 계정으로 로그인'}
                    </span>
                </button>
            </div>
        </div>
    );
};
