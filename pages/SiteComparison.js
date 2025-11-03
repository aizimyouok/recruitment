// --- 사이트 비교 ---
const { useMemo } = React;
// ChartComponent는 전역으로 로드됩니다.

const SiteComparison = ({ jobs, applicants, dailyRecords }) => {
    
    const combinations = [
        { site: '사람인', position: '영업' },
        { site: '사람인', position: '강사' },
        { site: '잡코리아', position: '영업' },
        { site: '잡코리아', position: '강사' },
        { site: '인크루트', position: '영업' },
        { site: '인크루트', position: '강사' },
    ];

    const siteData = useMemo(() => {
        return combinations.map(combo => {
            const { site, position } = combo;

            const siteJobs = jobs.filter(j => j.site === site && j.position === position); 
            const jobIds = siteJobs.map(j => j.id);
            
            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId)); 
            const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            
            // --- ⬇️ (수정) 'duplicates', 'rejectCancel', 'fails' 항목 추가 ⬇️ ---
            const totals = { 
                key: `${site}-${position}`,
                site, 
                position,
                jobs: siteJobs.length, 
                views: totalViews, 
                applications: 0, 
                duplicates: 0,
                rejectCancel: 0,
                contacts: 0, 
                interviews: 0, 
                offers: 0, 
                fails: 0,
                hires: 0 
            };
            
            siteApplicants.forEach(a => { 
                totals.applications++; 
                if (a.status === '중복') totals.duplicates++;
                if (a.status === '거절' || a.status === '취소') totals.rejectCancel++;
                if (a.status === '불합격') totals.fails++;

                if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++; 
                if (['합격', '입사'].includes(a.status)) totals.offers++; 
                if (a.status === '입사') totals.hires++; 
            });
            // --- ⬆️ (수정) ⬆️ ---
            
            totals.conversionRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;
            return totals;

        }).filter(data => data.jobs > 0); 
    }, [jobs, applicants, dailyRecords]);
    
    // --- ⬇️ (수정) 차트 데이터셋에 '중복', '거절/취소', '불합격' 추가 ⬇️ ---
    const chartData = {
        labels: siteData.map(d => `${d.site} (${d.position})`),
        datasets: [ 
            { label: '지원자', data: siteData.map(d => d.applications), backgroundColor: 'rgba(59, 130, 246, 0.8)' }, 
            { label: '중복', data: siteData.map(d => d.duplicates), backgroundColor: 'rgba(107, 114, 128, 0.8)' },
            { label: '거절/취소', data: siteData.map(d => d.rejectCancel), backgroundColor: 'rgba(239, 68, 68, 0.5)' },
            { label: '컨택', data: siteData.map(d => d.contacts), backgroundColor: 'rgba(234, 179, 8, 0.8)' },
            { label: '면접', data: siteData.map(d => d.interviews), backgroundColor: 'rgba(139, 92, 246, 0.8)' }, 
            { label: '합격', data: siteData.map(d => d.offers), backgroundColor: 'rgba(16, 185, 129, 0.8)' },
            { label: '불합격', data: siteData.map(d => d.fails), backgroundColor: 'rgba(239, 68, 68, 0.8)' },
            { label: '입사자', data: siteData.map(d => d.hires), backgroundColor: 'rgba(22, 163, 74, 1)' } 
        ]
    };
    // --- ⬆️ (수정) ⬆️ ---

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">사이트/유형 비교</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {siteData.map(data => (
                    <div key={data.key} className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-bold text-center mb-6">
                            {data.site} - <span className="text-blue-600">{data.position}</span>
                        </h3>
                        {/* --- ⬇️ (수정) '중복', '거절/취소', '합격/불합격' 포맷 적용 ⬇️ --- */}
                        <div className="space-y-3">
                            <div className="stat-item"><span className="stat-label">조회수</span><span className="stat-value">{data.views}</span></div>
                            <div className="stat-item"><span className="stat-label">지원자</span><span className="stat-value">{data.applications}</span></div>
                            <div className="stat-item"><span className="stat-label">중복</span><span className="stat-value text-red-600">{data.duplicates}</span></div>
                            <div className="stat-item"><span className="stat-label">거절/취소</span><span className="stat-value text-red-600">{data.rejectCancel}</span></div>
                            <div className="stat-item"><span className="stat-label">컨택</span><span className="stat-value">{data.contacts}</span></div>
                            <div className="stat-item"><span className="stat-label">면접</span><span className="stat-value">{data.interviews}</span></div>
                            <div className="stat-item">
                                <span className="stat-label">합격/불합격</span>
                                <span className="font-semibold">
                                    <span className="text-green-600">{data.offers}</span> / <span className="text-red-600">{data.fails}</span>
                                </span>
                            </div>
                            <div className="stat-item"><span className="stat-label">입사자</span><span className="stat-value text-blue-600">{data.hires}</span></div>
                            <div className="flex justify-between items-center pt-2"><span className="text-gray-600 font-semibold">전환율</span><span className="text-2xl font-bold text-blue-600">{data.conversionRate}%</span></div>
                        </div>
                        {/* --- ⬆️ (수정) ⬆️ --- */}
                    </div>
                ))}
            </div>
            {siteData.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    '영업' 또는 '강사' 유형의 공고 데이터가 없습니다.
                </div>
            )}
            {siteData.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">사이트/유형별 비교 차트</h3>
                    <div style={{ height: '350px' }}><ChartComponent type="bar" data={chartData} options={{ scales: { y: { beginAtZero: true } } }} /></div>
                </div>
            )}
        </div>
    );
};
