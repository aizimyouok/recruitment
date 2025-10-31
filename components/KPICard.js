// KPI 카드
const KPICard = ({ title, value, icon, color, subText }) => {
    // Icon 컴포넌트는 index.html에서 먼저 로드되어 전역으로 사용 가능합니다.
    const colorClasses = { blue: 'from-blue-500 to-blue-600', green: 'from-green-500 to-green-600', purple: 'from-purple-500 to-purple-600', orange: 'from-orange-500 to-orange-600' };
    return (
        <div className={`bg-gradient-to-br ${colorClasses[color]} rounded-xl shadow-lg p-6 text-white`}>
            <div className="flex items-center justify-between mb-2"> <Icon name={icon} size={32} /> <span className="text-3xl font-bold">{value}</span> </div>
            <p className="text-sm opacity-90">{title}</p>
            {subText && <p className="text-sm font-bold text-right mt-1">{subText}</p>}
        </div>
    );
};
