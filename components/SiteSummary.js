// --- 사이트별 현황 ---
// (React와 useMemo는 전역으로 로드됩니다)
// 이 컴포넌트는 Dashboard.js에서 사용됩니다.

const SiteSummary = ({ jobs, dailyRecords, applicants, filter }) => {
    // --- ⬇️ (수정) 집계 기준 변경: 'site' -> '(site, position)' 조합 ⬇️ ---
    
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

            // 3. 해당 조합(예: '사람인'의 '영업')에 해당하는 공고(jobs) 필터링
            const siteJobs = jobs.filter(j => j.site === site && j.position === position);
            const jobIds = siteJobs.map(j => j.id);

            // 4. 해당 공고 ID를 기반으로 데이터 집계
            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
            const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            
            const totals = { 
                jobs: siteJobs.length, 
                views: totalViews, 
                applications: 0, 
                contacts: 0, 
                interviews: 0, 
                offers: 0, 
                hires: 0 
            };
            
            siteApplicants.forEach(a => {
                totals.applications++;
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
                if (['합격', '입사'].includes(a.status)) totals.offers++;
                if (a.status === '입사') totals.hires++;
            });

            return { key: `${site}-${position}`, site, position, ...totals };
        }).filter(data => data.jobs > 0); // 공고가 1개라도 있는 항목만 표시
    }, [jobs, dailyRecords, applicants, filter]); // filter 대신 combinations (내부 생성)
    // --- ⬆️ (수정) 집계 로직 완료 ⬆️ ---

    return (
        // --- ⬇️ (수정) 3열 -> 2열 그리드로 변경 (더 많은 정보 표시) ⬇️ ---
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4`}>
            {summaryData.map(data => (
                <div key={data.key} className="border border-gray-200 rounded-lg p-4">
                    {/* --- ⬇️ (수정) 타이틀 변경 ⬇️ --- */}
                    <h4 className="font-semibold text-lg mb-3">
                        {data.site} - <span className="text-blue-600">{data.position}</span>
                    </h4>
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="stat-item"><span className="stat-label">공고 수:</span><span className="font-semibold">{data.jobs}</span></div>
                        <div className="stat-item"><span className="stat-label">조회수:</span><span className="font-semibold">{data.views}</span></div>
                        <div className="stat-item"><span className="stat-label">지원자:</span><span className="font-semibold">{data.applications}</span></div>
                        <div className="stat-item"><span className="stat-label">컨택:</span><span className="font-semibold">{data.contacts}</span></div>
                        <div className="stat-item"><span className="stat-label">면접:</span><span className="font-semibold">{data.interviews}</span></div>
                        <div className="stat-item"><span className="stat-label">합격:</span><span className="font-semibold">{data.offers}</span></div>
                        <div className="flex justify-between col-span-2 border-t pt-2 mt-1"><span className="text-gray-600 font-bold">입사:</span><span className="font-bold text-lg text-blue-600">{data.hires}명</span></div>
                    </div>
                </div>
            ))}
             {summaryData.length === 0 && (
                <p className="text-gray-500 col-span-1 md:col-span-2 text-center py-4">
                    {filter ? `(${filter}) 사이트의 '영업' 또는 '강사' 유형 공고가 없습니다.` : "데이터가 없습니다."}
                </p>
            )}
        </div>
    );
};
