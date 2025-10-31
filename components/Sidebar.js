// --- 사이드바 ---
// const { useState } = React; // Sidebar 자체는 useState를 사용하지 않고 props로 받습니다.
// Icon, auth는 전역으로 로드됩니다.

const Sidebar = ({ currentPage, setCurrentPage, user, isSidebarOpen, setIsSidebarOpen }) => {
    const menuItems = [
        { id: 'dashboard', name: '대시보드', icon: 'layout-dashboard' },
        { id: 'jobs', name: '공고 관리', icon: 'briefcase' },
        { id: 'applicants', name: '지원자 관리', icon: 'user-cog' },
        { id: 'daily', name: '조회수 업데이트', icon: 'plus-circle' },
        { id: 'compare', name: '사이트 비교', icon: 'git-compare' },
        { id: 'efficiency', name: '효율성 분석', icon: 'trending-up' },
        { id: 'trends', name: '트렌드 분석', icon: 'line-chart' },
        // --- ⬇️ 추가된 메뉴 ⬇️ ---
        { id: 'report', name: '리포트', icon: 'printer' },
        // --- ⬆️ 추가된 메뉴 ⬆️ ---
        { id: 'settings', name: '설정', icon: 'settings' }
    ];

    const handleLogout = () => {
        if (confirm('로그아웃 하시겠습니까?')) {
            auth.signOut();
        }
    };

    const selectMenu = (id) => {
        setCurrentPage(id);
        setIsSidebarOpen(false);
    };

    return (
        <>
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" onClick={() => setIsSidebarOpen(false)}></div>
            )}
            <div
                className={`sidebar w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-4 shadow-2xl flex flex-col h-full
                            fixed inset-y-0 left-0 z-30 transform md:relative md:translate-x-0
                            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
            >
                <div className="mb-8 text-center">
                    <h1 className="text-xl font-bold">채용 현황 관리</h1>
                    <p className="text-xs text-gray-400 mt-1">Recruitment Dashboard</p>
                </div>
                <nav className="space-y-2 flex-1 overflow-y-auto">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => selectMenu(item.id)}
                            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${currentPage === item.id ? 'bg-blue-600 shadow-lg' : 'hover:bg-gray-700'}`}
                        >
                            <Icon name={item.icon} size={20} />
                            <span>{item.name}</span>
                        </button>
                    ))}
                </nav>
                <div className="mt-auto border-t border-gray-700 pt-4">
                   <div className="flex items-center space-x-3 mb-2 px-2">
                        {user.photoURL ? (<img src={user.photoURL} alt="Profile" className="w-8 h-8 rounded-full" />)
                        : (<div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-sm font-bold">{user.displayName ? user.displayName[0] : user.email[0]}</div>)}
                        <span className="text-sm text-gray-300 truncate" title={user.displayName || user.email}>{user.displayName || user.email}</span>
                    </div>
                     <button onClick={handleLogout} className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all hover:bg-red-600">
                        <Icon name="log-out" size={20} /> <span>로그아웃</span>
                    </button>
                </div>
            </div>
        </>
    );
};
