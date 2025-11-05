// --- 효율성 분석 ---
const { useState, useMemo } = React;
// Input, Select, Button, Icon 등은 전역으로 로드됩니다.

const EfficiencyAnalysis = ({ jobs, applicants, siteSettings }) => {
    const [analysisType, setAnalysisType] = useState('site'); // 'site' or 'position'

    // --- ⬇️ (추가) 날짜 필터 상태 ⬇️ ---
    const [dateRangeType, setDateRangeType] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    const dateRange = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (dateRangeType === 'week') {
            const weekAgo = new Date(new Date().setDate(today.getDate() - 7));
            return { start: weekAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (dateRangeType === 'month') {
            const monthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
            return { start: monthAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (dateRangeType === 'custom' && customRange.start && customRange.end) {
            return customRange;
        }
        return { start: null, end: todayStr };
    }, [dateRangeType, customRange]);
    // --- ⬆️ (추가) ⬆️ ---


    const analysisData = useMemo(() => {
        
        // --- ⬇️ (추가) 날짜 필터링된 지원자 ⬇️ ---
        const filteredApplicants = applicants.filter(a => {
            if (dateRangeType === 'all' || !dateRange.start) return true;
            return a.appliedDate >= dateRange.start && a.appliedDate <= dateRange.end;
        });
        // --- ⬆️ (추가) ⬆️ ---

        // --- A. 사이트-유형별 분석 ---
        if (analysisType === 'site') {
            const combinations = [
                { site: '사람인', position: '영업' },
                { site: '사람인', position: '강사' },
                { site: '잡코리아', position: '영업' },
                { site: '잡코리아', position: '강사' },
                { site: '인크루트', position: '영업' },
                { site: '인크루트', position: '강사' },
            ];
            
            return combinations.map(combo => {
                const { site, position } = combo;
                
                const siteJobs = jobs.filter(j => j.site === site && j.position === position); 
                const jobIds = siteJobs.map(j => j.id); 
                const settings = siteSettings.find(s => s.site === site);
                
                // --- ⬇️ (수정) filteredApplicants 사용 ⬇️ ---
                const siteApplicants = filteredApplicants.filter(a => jobIds.includes(a.appliedJobId));
                // --- ⬆️ (수정) ⬆️ ---
                
                const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
                
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
                            totals.interviews++;
                            totals.contacts++;
                            break;
                        case '취소':
                            totals.interviews++;
                            totals.contacts++;
                            break;
                        case '거절':
                            totals.contacts++;
                            break;
                    }
                });

                const cost = 0; const costPerHire = 0;
                
                const rates = {
                    contactFromAppRate: totals.applications > 0 ? ((totals.contacts / totals.applications)*100).toFixed(1) : 0,
                    interviewFromContactRate: totals.contacts > 0 ? ((totals.interviews / totals.contacts)*100).toFixed(1) : 0,
                    // --- ⬇️ (수정) 버그 수정: (합격 / 면접) ⬇️ ---
                    offerFromInterviewRate: totals.interviews > 0 ? ((totals.offers / totals.interviews)*100).toFixed(1) : 0,
                    // --- ⬆️ (수정) ⬆️ ---
                    hireFromOfferRate: totals.offers > 0 ? ((totals.hires / totals.offers)*100).toFixed(1) : 0, 
                    overallRate: totals.applications > 0 ? ((totals.hires / totals.applications)*100).toFixed(1) : 0
                };
                
                return { 
                    key: `${site}-${position}`, 
                    name: `${site} - ${position}`, 
                    site: site, // 배경색 적용을 위해
                    ...totals, 
                    ...rates, 
                    cost, 
                    costPerHire, 
                    efficiency: parseFloat(rates.overallRate) 
                };
            }).filter(d => d.applications > 0); // 지원자가 0명인 조합은 숨김
        }
        
        // --- B. 모집유형별 분석 ---
        else {
            const positions = ['영업', '강사']; 
            return positions.map(pos => {
                const posJobs = jobs.filter(j => j.position === pos); const jobIds = posJobs.map(j => j.id);
                
                // --- ⬇️ (수정) filteredApplicants 사용 ⬇️ ---
                const posApplicants = filteredApplicants.filter(a => jobIds.includes(a.appliedJobId));
                // --- ⬆️ (수정) ⬆️ ---
                
                const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
                
                posApplicants.forEach(a => { 
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
                            totals.interviews++;
                            totals.contacts++;
                            break;
                        case '취소':
                            totals.interviews++;
                            totals.contacts++;
                            break;
                        case '거절':
                            totals.contacts++;
                            break;
                    }
                });
                
                const cost = 0; const costPerHire = 0; const efficiency = 0;
                
                const rates = {
                    contactFromAppRate: totals.applications > 0 ? ((totals.contacts / totals.applications) * 100).toFixed(1) : 0,
                    interviewFromContactRate: totals.contacts > 0 ? ((totals.interviews / totals.contacts) * 100).toFixed(1) : 0,
                    // --- ⬇️ (수정) 버그 수정: (합격 / 면접) ⬇️ ---
                    offerFromInterviewRate: totals.interviews > 0 ? ((totals.offers / totals.interviews) * 100).toFixed(1) : 0,
                    // --- ⬆️ (수정) ⬆️ ---
                    hireFromOfferRate: totals.offers > 0 ? ((totals.hires / totals.offers) * 100).toFixed(1) : 0, 
                    overallRate: totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0
                };
                return { key: pos, name: pos, site: null, ...totals, ...rates, cost, costPerHire, efficiency };
            });
        }
    // --- ⬇️ (수정) 종속성에 dateRange, dateRangeType 추가 ⬇️ ---
    }, [jobs, applicants, siteSettings, analysisType, dateRange, dateRangeType]);
    // --- ⬆️ (수정) ⬆️ ---

    // '사이트별 분석' 탭일 때의 ROI 데이터
    const siteROIEData = useMemo(() => {
        if (analysisType !== 'site') return [];

        // --- ⬇️ (추가) 날짜 필터링 ⬇️ ---
        const filteredApplicants = applicants.filter(a => {
            if (dateRangeType === 'all' || !dateRange.start) return true;
            return a.appliedDate >= dateRange.start && a.appliedDate <= dateRange.end;
        });
        // --- ⬆️ (추가) ⬆️ ---

        const sites = ['사람인', '잡코리아', '인크루트'];
        return sites.map(site => {
            const siteJobs = jobs.filter(j => j.site === site); const jobIds = siteJobs.map(j => j.id); const settings = siteSettings.find(s => s.site === site);
            
            // --- ⬇️ (수정) filteredApplicants 사용 ⬇️ ---
            const siteApplicants = filteredApplicants.filter(a => jobIds.includes(a.appliedJobId));
            // --- ⬆️ (수정) ⬆️ ---
            
            const totals = { applications: 0, hires: 0 };
            siteApplicants.forEach(a => { 
                totals.applications++; 
                if (a.status === '입사') totals.hires++; 
            });
            const cost = settings?.monthlyCost || 0; const costPerHire = totals.hires > 0 ? (cost / totals.hires).toFixed(0) : 0;
            const overallRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;
            
            return { key: site, name: site, ...totals, cost, costPerHire, overallRate, efficiency: parseFloat(overallRate) - (cost / 100000) };
        });
    // --- ⬇️ (수정) 종속성에 dateRange, dateRangeType 추가 ⬇️ ---
    }, [jobs, applicants, siteSettings, analysisType, dateRange, dateRangeType]);
    // --- ⬆️ (수정) ⬆️ ---


    const sortedROIEData = [...siteROIEData].sort((a, b) => b.overallRate - a.overallRate);

    const siteBgColors = {
        '사람인': 'bg-blue-50',
        '잡코리아': 'bg-green-50',
        '인크루트': 'bg-yellow-50'
    };

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">효율성 분석</h2>
            
            <div className="flex space-x-2 mb-6">
                <button onClick={() => setAnalysisType('site')} className={`btn-tab ${analysisType === 'site' ? 'btn-tab-active' : ''}`}>사이트-유형별 분석</button>
                <button onClick={() => setAnalysisType('position')} className={`btn-tab ${analysisType === 'position' ? 'btn-tab-active' : ''}`}>모집유형별 분석</button>
            </div>

            {/* --- ⬇️ (추가) 날짜 필터 UI ⬇️ --- */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    <div>
                        <label className="label-style">기간</label>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                                {['all', 'week', 'month', 'custom'].map(type => (
                                    <button key={type} onClick={() => setDateRangeType(type)} className={`px-3 py-1 rounded-md text-sm font-medium ${dateRangeType === type ? 'bg-white shadow text-blue-600' : 'text-gray-600 hover:text-gray-800'}`}>
                                        { {all: '전체', week: '1주', month: '1개월', custom: '기간'}[type] }
                                    </button>
                                ))}
                            </div>
                            {dateRangeType === 'custom' && (
                                <div className="flex items-center space-x-2">
                                    <Input type="date" value={customRange.start} onChange={(e) => setCustomRange(p => ({...p, start: e.target.value}))} className="px-3 py-1 text-sm" />
                                    <span>~</span>
                                    <Input type="date" value={customRange.end} onChange={(e) => setCustomRange(p => ({...p, end: e.target.value}))} className="px-3 py-1 text-sm" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* --- ⬆️ (추가) ⬆️ --- */}


            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-6">
                    단계별 전환율
                    <span className="text-sm text-gray-500 ml-2">
                         ({dateRangeType === 'all' ? '전체 기간' : `${dateRange.start} ~ ${dateRange.end}`})
                    </span>
                </h3>
                <div className="space-y-6">
                    {analysisData.map(data => {
                        const bgColor = data.site ? (siteBgColors[data.site] || 'bg-gray-50') : 'bg-gray-50';
                        return (
                            <div key={data.key} className={`border-b last:border-b-0 p-4 rounded-lg ${bgColor}`}>
                                <h4 className="font-semibold text-lg mb-3">
                                    {data.name}
                                    {analysisType === 'position' && data.name === '강사' && <span className="text-blue-600"> (강사)</span>}
                                </h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div>
                                        <span className="text-gray-600">지원 ({data.applications}) → 컨택 ({data.contacts})</span>
                                        <p className="rate-value text-blue-500">{data.contactFromAppRate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">컨택 ({data.contacts}) → 면접 ({data.interviews})</span>
                                        <p className="rate-value text-blue-600">{data.interviewFromContactRate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">면접 ({data.interviews}) → 합격 ({data.offers})</span>
                                        <p className="rate-value text-purple-600">{data.offerFromInterviewRate}%</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-600">합격 ({data.offers}) → 입사 ({data.hires})</span>
                                        <p className="rate-value text-green-600">{data.hireFromOfferRate}%</p>
                                    </div>
                                </div>
                                <div className="mt-3 pt-3 border-t">
                                    <span className="text-gray-600">총 전환율 (지원 ({data.applications}) → 입사 ({data.hires}))</span>
                                    <p className="text-2xl font-bold text-blue-600">{data.overallRate}%</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {analysisType === 'site' && (
                <>
                    <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                        <h3 className="text-xl font-semibold mb-6">
                            비용 대비 효과 (ROI) - 사이트 기준
                            <span className="text-sm text-gray-500 ml-2">
                                ({dateRangeType === 'all' ? '전체 기간' : `${dateRange.start} ~ ${dateRange.end}`})
                            </span>
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50"><tr><th className="th-style">사이트</th><th className="th-style">월 이용료</th><th className="th-style">입사자</th><th className="th-style">1인당 비용</th><th className="th-style">효율성 점수</th></tr></thead>
                                <tbody className="divide-y divide-gray-200">
                                    {siteROIEData.map(data => (
                                        <tr key={data.key} className="hover:bg-gray-50">
                                            <td className="td-style table-cell-nowrap">{data.name}</td><td className="td-style table-cell-nowrap">{data.cost.toLocaleString()}원</td><td className="td-style table-cell-nowrap">{data.hires}명</td>
                                            <td className="td-style table-cell-nowrap font-semibold text-blue-600">{data.costPerHire > 0 ? `${parseInt(data.costPerHire).toLocaleString()}원` : '-'}</td>
                                            <td className="td-style table-cell-nowrap"><span className={`badge-sm ${data.efficiency > 5 ? 'badge-green' : data.efficiency > 0 ? 'badge-yellow' : 'badge-red'}`}>{data.efficiency > 0 ? '높음' : data.efficiency > -5 ? '보통' : '낮음'}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-semibold mb-6">
                            사이트별 종합 순위 (ROI 기준)
                            <span className="text-sm text-gray-500 ml-2">
                                ({dateRangeType === 'all' ? '전체 기간' : `${dateRange.start} ~ ${dateRange.end}`})
                            </span>
                        </h3>
                        <div className="space-y-4">
                            {sortedROIEData.map((data, index) => (
                                <div key={data.key} className="flex flex-col md:flex-row items-start md:items-center space-y-2 md:space-y-0 md:space-x-4 p-4 bg-gray-50 rounded-lg">
                                    <div className={`text-3xl font-bold ${index === 0 ? 'text-yellow-500' : index === 1 ? 'text-gray-400' : 'text-orange-600'}`}>{index + 1}</div>
                                    <div className="flex-1"><h4 className="font-semibold text-lg">{data.name}</h4><p className="text-sm text-gray-600">전환율 {data.overallRate}% | 입사자 {data.hires}명</p></div>
                                    <div className="text-left md:text-right w-full md:w-auto"><p className="text-sm text-gray-600">1인당 비용</p><p className="text-lg font-bold text-blue-600">{data.costPerHire > 0 ? `${parseInt(data.costPerHire).toLocaleString()}원` : '-'}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
