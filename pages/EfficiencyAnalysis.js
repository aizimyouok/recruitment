// --- 효율성 분석 ---
const { useMemo } = React;
// (컴포넌트들은 전역으로 로드됩니다)

const EfficiencyAnalysis = ({ jobs, applicants, siteSettings }) => {
    const analysisData = useMemo(() => {
        const sites = ['사람인', '잡코리아', '인크루트'];
        return sites.map(site => {
            const siteJobs = jobs.filter(j => j.site === site); const jobIds = siteJobs.map(j => j.id); const settings = siteSettings.find(s => s.site === site);
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
            siteApplicants.forEach(a => { totals.applications++; if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++; if (['합격', '입사'].includes(a.status)) totals.offers++; if (a.status === '입사') totals.hires++; });
            const cost = settings?.monthlyCost || 0; const costPerHire = totals.hires > 0 ? (cost / totals.hires).toFixed(0) : 0;
            const rates = {
                interviewFromAppRate: totals.applications > 0 ? ((totals.interviews / totals.applications) * 100).toFixed(1) : 0, offerFromInterviewRate: totals.interviews > 0 ? ((totals.offers / totals.interviews) * 100).toFixed(1) : 0,
                hireFromOfferRate: totals.offers > 0 ? ((totals.hires / totals.offers) * 100).toFixed(1) : 0, overallRate: totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0
            };
            return { site, ...totals, ...rates, cost, costPerHire, efficiency: parseFloat(rates.overallRate) - (cost / 100000) };
        });
    }, [jobs, applicants, siteSettings]);
    const sortedBySite = [...analysisData].sort((a, b) => b.overallRate - a.overallRate);
    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">효율성 분석</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-6">단계별 전환율</h3>
                <div className="space-y-6">
                    {analysisData.map(data => (
                        <div key={data.site} className="border-b pb-4 last:border-b-0">
                            <h4 className="font-semibold text-lg mb-3">{data.site}</h4>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div><span className="text-gray-600">지원 → 면접</span><p className="rate-value text-blue-600">{data.interviewFromAppRate}%</p></div>
                                <div><span className="text-gray-600">면접 → 합격</span><p className="rate-value text-purple-600">{data.offerFromInterviewRate}%</p></div>
                                <div><span className="text-gray-600">합격 → 입사</span><p className="rate-value text-green-600">{data.hireFromOfferRate}%</p></div>
                            </div>
                            <div className="mt-3 pt-3 border-t"><span className="text-gray-600">총 전환율 (지원 → 입사)</span><p className="text-2xl font-bold text-blue-600">{data.overallRate}%</p></div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-6">비용 대비 효과 (ROI)</h3>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50"><tr><th className="th-style">사이트</th><th className="th-style">월 이용료</th><th className="th-style">입사자</th><th className="th-style">1인당 비용</th><th className="th-style">효율성 점수</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {analysisData.map(data => (
                                <tr key={data.site} className="hover:bg-gray-50">
                                    <td className="td-style table-cell-nowrap">{data.site}</td><td className="td-style table-cell-nowrap">{data.cost.toLocaleString()}원</td><td className="td-style table-cell-nowrap">{data.hires}명</td>
                                    <td className="td-style table-cell-nowrap font-semibold text-blue-600">{data.costPerHire > 0 ? `${parseInt(data.costPerHire).toLocaleString()}원` : '-'}</td>
                                    <td className="td-style table-cell-nowrap"><span className={`badge-sm ${data.efficiency > 5 ? 'badge-green' : data.efficiency > 0 ? 'badge-yellow' : 'badge-red'}`}>{data.efficiency > 0 ? '높음' : data.efficiency > -5 ? '보통' : '낮음'}</span></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-6">사이트별 종합 순위</h3>
                <div className="space-y-4">
                    {sortedBySite.map((data, index) => (
                        <div key={data.site} className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                            <div className={`text-3xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}>{index + 1}</div>
                            <div className="flex-1"><h4 className="font-semibold text-lg">{data.site}</h4><p className="text-sm text-gray-600">전환율 {data.overallRate}% | 입사자 {data.hires}명</p></div>
                            <div className="text-left md:text-right w-full md:w-auto"><p className="text-sm text-gray-600">1인당 비용</p><p className="text-lg font-bold text-blue-600">{data.costPerHire > 0 ? `${parseInt(data.costPerHire).toLocaleString()}원` : '-'}</p></div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
