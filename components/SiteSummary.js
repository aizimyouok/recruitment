// --- 사이트별 현황 ---
// (React와 useMemo는 전역으로 로드됩니다)
// 이 컴포넌트는 Dashboard.js에서 사용됩니다.

const SiteSummary = ({ jobs, dailyRecords, applicants, filter }) => {
    
    // 1. 분석할 조합 정의
    const sites = filter ? [filter] : ['사람인', '잡코리아', '인크루트'];
    const positions = ['영업', '강사'];
    const combinations = [];
    sites.forEach(site => {
        positions.forEach(pos => {
            combinations.push({ site, position: pos });
        });
    });

    // 2. 각 조합별로 데이터 집계
    const summaryData = useMemo(() => {
        return combinations.map(combo => {
            const { site, position } = combo;

            const siteJobs = jobs.filter(j => j.site === site && j.position === position);
            const jobIds = siteJobs.map(j => j.id);

            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
            const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            
            // --- ⬇️ (수정) 'rejectCancel' 항목 추가 ⬇️ ---
            const totals = { 
                jobs: siteJobs.length, 
                views: totalViews, 
                applications: 0, 
                duplicates: 0, 
                rejectCancel: 0, // '거절/취소' 카운트
                contacts: 0, 
                interviews: 0, 
                offers: 0, 
                hires: 0 
            };
            
            siteApplicants.forEach(a => {
                totals.applications++; 
                
                if (a.status === '중복') totals.duplicates++;
                if (a.status === '거절' || a.status === '취소') totals.rejectCancel++;
                
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
                if (['합격', '입사'].includes(a.status)) totals.offers++;
                if (a.status === '입사') totals.hires++;
            });
            // --- ⬆️ (수정) ⬆️ ---

            return { key: `${site}-${position}`, site, position, ...totals };
        }).filter(data => data.jobs > 0); 
    }, [jobs, dailyRecords, applicants, filter]);

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {summaryData.map(data => (
                <div key={data.key} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3">
                        {data.site} - <span className="text-blue-600">{data.position}</span>
                    </h4>
                    {/* --- ⬇️ (수정) '거절/취소' 항목 추가 (8개 항목, 2x4 grid) ⬇️ --- */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="stat-item"><span className="stat-label">조회수:</span><span className="font-semibold">{data.views}</span></div>
                        <div className="stat-item"><span className="stat-label">지원자:</span><span className="font-semibold">{data.applications}</span></div>
                        
                        <div className="stat-item"><span className="stat-label">중복:</span><span className="font-semibold text-red-600">{data.duplicates}</span></div>
                        <div className="stat-item"><span className="stat-label">거절/취소:</span><span className="font-semibold text-red-600">{data.rejectCancel}</span></div>

                        <div className="stat-item"><span className="stat-label">컨택:</span><span className="font-semibold">{data.contacts}</span></div>
                        <div className="stat-item"><span className="stat-label">면접:</span><span className="font-semibold">{data.interviews}</span></div>

                        <div className="stat-item"><span className="stat-label">합격:</span><span className="font-semibold">{data.offers}</span></div>
                        <div className="stat-item"><span className="stat-label">입사:</span><span className="font-semibold text-blue-600">{data.hires}</span></div>
                    </div>
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                </div>
            ))}
             {summaryData.length === 0 && (
                <p className="text-gray-500 col-span-1 md:col-span-2 lg:col-span-3 text-center py-4">
                    {filter ? `(${filter}) 사이트의 '영업' 또는 '강사' 유형 공고가 없습니다.` : "데이터가 없습니다."}
                </p>
            )}
        </div>
    );
};
