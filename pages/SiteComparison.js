// --- 사이트 비교 ---
const { useMemo } = React;
// ChartComponent는 전역으로 로드됩니다.

const SiteComparison = ({ jobs, applicants, dailyRecords }) => {
    const sites = ['사람인', '잡코리아', '인크루트'];
    const siteData = useMemo(() => {
        return sites.map(site => {
            const siteJobs = jobs.filter(j => j.site === site); const jobIds = siteJobs.map(j => j.id);
            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId)); const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            const totals = { site, jobs: siteJobs.length, views: totalViews, applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
            
            // --- ⬇️ 수정된 누적 집계 로직 ⬇️ ---
            siteApplicants.forEach(a => { 
                totals.applications++; 
                
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) {
                    totals.contacts++;
                }
                if (['면접', '합격', '입사'].includes(a.status)) {
                    totals.interviews++;
                }
                if (['합격', '입사'].includes(a.status)) {
                    totals.offers++;
                }
                if (a.status === '입사') {
                    totals.hires++;
                }
            });
            // --- ⬆️ 수정된 누적 집계 로직 ⬆️ ---

            totals.conversionRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;
            return totals;
        });
    }, [jobs, applicants, dailyRecords]);

    const chartData = {
        labels: siteData.map(d => d.site),
        datasets: [ 
            { label: '지원자', data: siteData.map(d => d.applications), backgroundColor: 'rgba(59, 130, 246, 0.8)' }, 
            { label: '컨택', data: siteData.map(d => d.contacts), backgroundColor: 'rgba(234, 179, 8, 0.8)' }, // '컨택' 추가
            { label: '면접', data: siteData.map(d => d.interviews), backgroundColor: 'rgba(139, 92, 246, 0.8)' }, 
            { label: '입사자', data: siteData.map(d => d.hires), backgroundColor: 'rgba(16, 185, 129, 0.8)' } 
        ]
    };

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">사이트 비교</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {siteData.map(data => (
                    <div key={data.site} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-center mb-6 text-blue-600">{data.site}</h3>
                        <div className="space-y-3">
                            <div className="stat-item"><span className="stat-label">공고 수</span><span className="stat-value">{data.jobs}</span></div><div className="stat-item"><span className="stat-label">조회수</span><span className="stat-value">{data.views}</span></div>
                            <div className="stat-item"><span className="stat-label">지원자</span><span className="stat-value">{data.applications}</span></div>
                            <div className="stat-item"><span className="stat-label">컨택</span><span className="stat-value">{data.contacts}</span></div> {/* '컨택' 추가 */}
                            <div className="stat-item"><span className="stat-label">면접</span><span className="stat-value">{data.interviews}</span></div>
                            <div className="stat-item"><span className="stat-label">합격자</span><span className="stat-value">{data.offers}</span></div>
                            <div className="stat-item"><span className="stat-label">입사자</span><span className="stat-value text-green-600">{data.hires}</span></div>
                            <div className="flex justify-between items-center pt-2"><span className="text-gray-600 font-semibold">전환율</span><span className="text-2xl font-bold text-blue-600">{data.conversionRate}%</span></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-semibold mb-4">사이트별 비교 차트</h3><div style={{ height: '350px' }}><ChartComponent type="bar" data={chartData} options={{ scales: { y: { beginAtZero: true } } }} /></div>
            </div>
        </div>
    );
};
