// --- 공고별 상세 분석 모달 ---
const { useMemo } = React;
// Icon, ConversionStep, ChartComponent, ApplicantStatusBadge는 전역으로 로드됩니다.

const JobDetailModal = ({ job, applicants, onClose }) => {
    const jobStats = useMemo(() => {
        const jobApplicants = applicants.filter(a => a.appliedJobId === job.id);
        const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
        const trend = {};
        jobApplicants.forEach(a => {
            totals.applications++;
            if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
            if (['합격', '입사'].includes(a.status)) totals.offers++;
            if (a.status === '입사') totals.hires++;
            trend[a.appliedDate] = (trend[a.appliedDate] || 0) + 1;
        });
        const conversionRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;
        const sortedTrend = Object.entries(trend).sort((a, b) => a[0].localeCompare(b[0]));
        return { ...totals, conversionRate, trendData: sortedTrend, applicantList: jobApplicants };
    }, [job, applicants]);

    const chartData = {
        labels: jobStats.trendData.map(d => d[0]),
        datasets: [{ label: '일별 지원자 수', data: jobStats.trendData.map(d => d[1]), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.1, fill: true }]
    };

    return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-enter-active">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div><h3 className="text-2xl font-bold text-gray-800">{job.title}</h3><p className="text-gray-600">{job.site} | {job.position}</p></div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" size={24} /></button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                     <div className="kpi-box"><p className="kpi-label">총 지원자</p><p className="kpi-value text-blue-600">{jobStats.applications}</p></div>
                     <div className="kpi-box"><p className="kpi-label">총 입사자</p><p className="kpi-value text-green-600">{jobStats.hires}</p></div>
                     <div className="kpi-box"><p className="kpi-label">전환율</p><p className="kpi-value text-purple-600">{jobStats.conversionRate}%</p></div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                    <h4 className="text-xl font-semibold mb-4">단계별 상세</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4"><ConversionStep label="컨택" value={jobStats.contacts} /><ConversionStep label="면접" value={jobStats.interviews} /><ConversionStep label="합격" value={jobStats.offers} /></div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
                     <h4 className="text-xl font-semibold mb-4">일별 지원자 트렌드</h4>
                     <div style={{ height: '250px' }}><ChartComponent type="line" data={chartData} options={{ scales: { y: { beginAtZero: true } } }} /></div>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h4 className="text-xl font-semibold mb-4">지원자 목록 ({jobStats.applicantList.length}명)</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr><th className="th-style">이름</th><th className="th-style">성별</th><th className="th-style">나이</th><th className="th-style">연락처</th><th className="th-style">지원일</th><th className="th-style">상태</th></tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {jobStats.applicantList.map(a => (
                                    <tr key={a.id}>
                                        <td className="td-style table-cell-nowrap">{a.name}</td><td className="td-style table-cell-nowrap">{a.gender}</td><td className="td-style table-cell-nowrap">{a.age}</td>
                                        <td className="td-style table-cell-nowrap">{a.contactInfo}</td><td className="td-style table-cell-nowrap">{a.appliedDate}</td>
                                        <td className="td-style table-cell-nowrap"><ApplicantStatusBadge status={a.status} /></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {jobStats.applicantList.length === 0 && <p className="text-center text-gray-500 py-4">이 공고의 지원자가 없습니다.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};
