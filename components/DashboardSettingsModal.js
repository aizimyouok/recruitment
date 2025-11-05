// --- 대시보드 위젯 설정 모달 ---
const { useState } = React;
// Icon은 전역으로 로드됩니다.

const DashboardSettingsModal = ({ settings, onSave, onClose }) => {
    const [currentSettings, setCurrentSettings] = useState(settings);
    const handleToggle = (key) => setCurrentSettings(prev => ({ ...prev, [key]: !prev[key] }));
    const handleSave = () => onSave(currentSettings);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 transition-all modal-enter-active">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-gray-800">대시보드 위젯 설정</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" size={20} /></button>
                </div>
                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">KPI 카드</span>
                        <input type="checkbox" checked={currentSettings.kpi} onChange={() => handleToggle('kpi')} className="h-5 w-5 text-blue-600 rounded" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">전환율 분석</span>
                        <input type="checkbox" checked={currentSettings.conversion} onChange={() => handleToggle('conversion')} className="h-5 w-5 text-blue-600 rounded" />
                    </label>
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">사이트별 현황</span>
                        <input type="checkbox" checked={currentSettings.siteSummary} onChange={() => handleToggle('siteSummary')} className="h-5 w-5 text-blue-600 rounded" />
                    </label>
                     <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">사이트별 비교 차트</span>
                        <input type="checkbox" checked={currentSettings.siteChart} onChange={() => handleToggle('siteChart')} className="h-5 w-5 text-blue-600 rounded" />
                    </label>
                    {/* --- ⬇️ (추가) '지원자 통계' 토글 ⬇️ --- */}
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-700">지원자 통계 현황</span>
                        <input type="checkbox" checked={currentSettings.demographics} onChange={() => handleToggle('demographics')} className="h-5 w-5 text-blue-600 rounded" />
                    </label>
                    {/* --- ⬆️ (추가) ⬆️ --- */}
                </div>
                <div className="mt-6">
                    <button onClick={handleSave} className="w-full btn-primary py-3"> 저장 </button>
                </div>
            </div>
        </div>
    );
};
