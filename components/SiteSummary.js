// --- 사이트별 현황 ---
// (React와 useMemo는 전역으로 로드됩니다)
// 이 컴포넌트는 Dashboard.js에서 사용됩니다.

// --- ⬇️ (수정) dateRange, dateRangeType props 추가 ⬇️ ---
const SiteSummary = ({ jobs, dailyRecords, applicants, filter, dateRange, dateRangeType }) => {
    
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
        
        // --- ⬇️ (수정) 날짜 필터링 로직 추가 ⬇️ ---
        const filteredRecords = dailyRecords.filter(r => {
            if (dateRangeType === 'all' || !dateRange.start) return true;
            return r.date >= dateRange.start && r.date <= dateRange.end;
        });
        
        const filteredApplicants = applicants.filter(a => {
            if (dateRangeType === 'all' || !dateRange.start) return true;
            return a.appliedDate >= dateRange.start && a.appliedDate <= dateRange.end;
        });
        // --- ⬆️ (수정) ⬆️ ---

        return combinations.map(combo => {
            const { site, position } = combo;

            const siteJobs = jobs.filter(j => j.site === site && j.position === position);
            const jobIds = siteJobs.map(j => j.id);

            // --- ⬇️ (수정) 필터링된 데이터 사용 ⬇️ ---
            const siteRecords = filteredRecords.filter(r => jobIds.includes(r.jobId));
            const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const siteApplicants = filteredApplicants.filter(a => jobIds.includes(a.appliedJobId));
            // --- ⬆️ (수정) ⬆️ ---
            
            const totals = { 
                jobs: siteJobs.length, 
                views: totalViews, 
                applications: 0, 
                duplicates: 0, 
                reject: 0, // '거절'
                cancel: 0, // '취소'
                contacts: 0, 
                interviews: 0, 
                offers: 0, 
                fails: 0, // '불합격'
                hires: 0,
                exclude: 0 // '제외'
            };
            
            siteApplicants.forEach(a => {
                totals.applications++; 
                
                switch (a.status) {
                    case '입사':
                        totals.hires++;
                        totals.offers++;
                        totals.interviews++;
                        totals.contacts++;
                        break;
                    case '합격':
                        totals.offers++;
                        totals.interviews++;
                        totals.contacts++;
                        break;
                    case '면접':
                        totals.interviews++;
                        totals.contacts++;
                        break;
                    case '컨택':
                        totals.contacts++;
                        break;
                    case '불합격':
                        totals.fails++;
                        totals.interviews++;
                        totals.contacts++;
                        break;
                    case '취소':
                        totals.cancel++;
                        totals.interviews++;
                        totals.contacts++;
                        break;
                    case '거절':
                        totals.reject++;
                        totals.contacts++;
                        break;
                    case '중복':
                        totals.duplicates++;
                        break;
                    case '제외':
                        totals.exclude++;
                        break;
                    default:
                        break;
                }
            });

            return { key: `${site}-${position}`, site, position, ...totals };
        }).filter(data => data.jobs > 0 || (filter && data.jobs === 0)); // filter가 활성화된 경우, 0개여도 표시
    // --- ⬇️ (수정) useMemo 종속성에 dateRange와 dateRangeType 추가 ⬇️ ---
    }, [jobs, dailyRecords, applicants, filter, dateRange, dateRangeType]);
    // --- ⬆️ (수정) ⬆️ ---

    const siteBgColors = {
        '사람인': 'bg-blue-50',
        '잡코리아': 'bg-green-50',
        '인크루트': 'bg-yellow-50'
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`}>
            {summaryData.map(data => {
                const bgColor = siteBgColors[data.site] || 'border-gray-200';
                return (
                    <div key={data.key} className={`border rounded-lg p-4 ${bgColor}`}>
                        <h4 className="font-semibold text-lg mb-3">
                            {data.site} - <span className="text-blue-600">{data.position}</span>
                        </h4>
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 text-sm">
                            <div className="stat-item flex-col items-start"><span className="stat-label">조회수</span><span className="font-semibold">{data.views}</span></div>
                            <div className="stat-item flex-col items-start"><span className="stat-label">지원자</span><span className="font-semibold">{data.applications}</span></div>
                            <div className="stat-item flex-col items-start"><span className="stat-label">중복</span><span className="font-semibold text-red-600">{data.duplicates}</span></div>
                            
                            <div className="stat-item flex-col items-start"><span className="stat-label">컨택</span><span className="font-semibold">{data.contacts}</span></div>
                            <div className="stat-item flex-col items-start"><span className="stat-label">면접</span><span className="font-semibold">{data.interviews}</span></div>
                            <div className="stat-item flex-col items-start">
                                <span className="stat-label">합격/불합격</span>
                                <span className="font-semibold">
                                    <span className="text-green-600">{data.offers}</span>/<span className="text-red-600">{data.fails}</span>
                                </span>
                            </div>

                            <div className="stat-item flex-col items-start"><span className="stat-label">거절</span><span className="font-semibold text-red-600">{data.reject}</span></div>
                            <div className="stat-item flex-col items-start"><span className="stat-label">취소</span><span className="font-semibold text-red-600">{data.cancel}</span></div>
                            <div className="stat-item flex-col items-start"><span className="stat-label">제외</span><span className="font-semibold text-red-600">{data.exclude}</span></div>
                        </div>
                        <div className="flex justify-between items-center border-t pt-2 mt-2"><span className="text-gray-600 font-bold">입사:</span><span className="font-bold text-lg text-blue-600">{data.hires}명</span></div>
                    </div>
                );
            })}
             {summaryData.length === 0 && (
                <p className="text-gray-500 col-span-1 md:col-span-2 lg:col-span-3 text-center py-4">
                    {filter ? `(${filter}) 사이트의 '영업' 또는 '강사' 유형 공고가 없습니다.` : "데이터가 없습니다."}
                </p>
            )}
        </div>
    );
};
