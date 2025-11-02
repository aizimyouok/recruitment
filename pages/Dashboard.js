// --- 대시보드 ---
const { useState, useMemo } = React;
// Icon, ChartComponent, DashboardSettingsModal, KPICard, ConversionStep, SiteSummary, Input, Select 등
// 필요한 컴포넌트들은 index.html에서 전역으로 로드됩니다.

const Dashboard = ({ jobs, dailyRecords, applicants, siteSettings, goals }) => {
    const [dateRangeType, setDateRangeType] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });

    // --- ⬇️ (수정) 'siteFilter'와 'positionFilter'를 객체(체크박스용)로 변경 ⬇️ ---
    const [siteFilter, setSiteFilter] = useState({
        '사람인': true,
        '잡코리아': true,
        '인크루트': true,
    });
    const [positionFilter, setPositionFilter] = useState({
        '영업': true,
        '강사': true,
    });
    // --- ⬆️ (수정) ⬆️ ---

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [widgetSettings, setWidgetSettings] = useState(() => {
        const saved = localStorage.getItem('dashboardWidgetSettings');
        return saved ? JSON.parse(saved) : { kpi: true, conversion: true, siteSummary: true, siteChart: true };
    });
    const [showSiteChart, setShowSiteChart] = useState(widgetSettings.siteChart);

    // --- ⬇️ (추가) 체크박스 핸들러 함수 ⬇️ ---
    const handleSiteFilterChange = (siteKey) => {
        setSiteFilter(prev => ({ ...prev, [siteKey]: !prev[siteKey] }));
    };
    const handleSelectAllSites = (e) => {
        const isChecked = e.target.checked;
        setSiteFilter({ '사람인': isChecked, '잡코리아': isChecked, '인크루트': isChecked });
    };
    
    const handlePositionFilterChange = (posKey) => {
        setPositionFilter(prev => ({ ...prev, [posKey]: !prev[posKey] }));
    };
    const handleSelectAllPositions = (e) => {
        const isChecked = e.target.checked;
        setPositionFilter({ '영업': isChecked, '강사': isChecked });
    };
    
    // 선택된 항목들을 배열로 변환 (필터링 로직용)
    const selectedSites = useMemo(() => Object.keys(siteFilter).filter(key => siteFilter[key]), [siteFilter]);
    const selectedPositions = useMemo(() => Object.keys(positionFilter).filter(key => positionFilter[key]), [positionFilter]);
    // --- ⬆️ (추가) ⬆️ ---


    const handleSaveWidgetSettings = (newSettings) => {
        setWidgetSettings(newSettings);
        localStorage.setItem('dashboardWidgetSettings', JSON.stringify(newSettings));
        setShowSiteChart(newSettings.siteChart);
        setShowSettingsModal(false);
    };

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

    const filteredData = useMemo(() => {
        // --- ⬇️ (수정) 필터링 로직 변경 (체크박스 배열 사용) ⬇️ ---
        const filteredJobs = jobs.filter(j => 
            (selectedSites.includes(j.site)) &&
            (selectedPositions.includes(j.position))
        );
        // --- ⬆️ (수정) ⬆️ ---
        const jobIds = filteredJobs.map(j => j.id);

        const filteredRecords = dailyRecords.filter(r => {
            const inSite = jobIds.includes(r.jobId);
            if (!inSite) return false;
            if (dateRange.start && dateRange.end && dateRangeType !== 'all') {
                return r.date >= dateRange.start && r.date <= dateRange.end;
            }
            return true;
        });

        const filteredApplicants = applicants.filter(a => {
            const inSite = jobIds.includes(a.appliedJobId);
            if (!inSite) return false;
            if (dateRange.start && dateRange.end && dateRangeType !== 'all') {
                return a.appliedDate >= dateRange.start && a.appliedDate <= dateRange.end;
            }
            return true;
        });

        return { filteredJobs, filteredRecords, filteredApplicants };
    }, [jobs, dailyRecords, applicants, siteFilter, positionFilter, dateRange, dateRangeType, selectedSites, selectedPositions]); // 의존성 추가

    const stats = useMemo(() => {
        const activeJobs = filteredData.filteredJobs.filter(j => j.status === '진행중');
        const totalViews = filteredData.filteredRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
        const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
        
        filteredData.filteredApplicants.forEach(a => {
            totals.applications++;
            if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
            if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
            if (['합격', '입사'].includes(a.status)) totals.offers++;
            if (a.status === '입사') totals.hires++;
        });

        const conversionRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;

        const targetYearMonth = dateRange.end.substring(0, 7);
        const currentGoal = goals.find(g => g.yearMonth === targetYearMonth);
        let targetHires = 0;
        // --- ⬇️ (수정) 목표 달성률 로직 (다중 사이트 선택 반영) ⬇️ ---
        if (currentGoal) {
            targetHires = 0;
            if (selectedSites.length === 3) { // 전체 선택
                targetHires = currentGoal.targetHires || 0;
            } else { // 1개 또는 2개 선택
                if (selectedSites.includes('사람인')) targetHires += currentGoal.targetSaramin || 0;
                if (selectedSites.includes('잡코리아')) targetHires += currentGoal.targetJobkorea || 0;
                if (selectedSites.includes('인크루트')) targetHires += currentGoal.targetIncruit || 0;
            }
        }
        // --- ⬆️ (수정) ⬆️ ---
        const achievementRate = targetHires > 0 ? ((totals.hires / targetHires) * 100).toFixed(0) : 0;

        return {
            activeJobs: activeJobs.length, views: totalViews, ...totals,
            conversionRate, targetHires, achievementRate
        };
    }, [filteredData, selectedSites, selectedPositions, dateRange, goals]); // 의존성 수정

    const radarChartData = useMemo(() => {
        const sites = ['사람인', '잡코리아', '인크루트'];
        const labels = ['조회수', '지원자', '컨택', '면접', '합격', '입사'];
        const datasets = sites.map((site, index) => {
            const siteJobs = jobs.filter(j => j.site === site); 
            const jobIds = siteJobs.map(j => j.id);
            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            
            const views = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const applications = siteApplicants.length;
            let contacts = 0, interviews = 0, offers = 0, hires = 0;
            siteApplicants.forEach(a => {
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) interviews++;
                if (['합격', '입사'].includes(a.status)) offers++;
                if (a.status === '입사') hires++;
            });
            const data = [views, applications, contacts, interviews, offers, hires];
            const colors = ['rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)'];
            const borderColors = ['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)'];
            return {
                label: site, data: data, fill: true, backgroundColor: colors[index % colors.length], borderColor: borderColors[index % borderColors.length],
                pointBackgroundColor: borderColors[index % borderColors.length], pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: borderColors[index % borderColors.length]
            };
        });
        return { labels, datasets };
    }, [jobs, dailyRecords, applicants]);
    
    const positionSummaryData = useMemo(() => {
        const positions = ['영업', '강사'];
        
        const dateFilteredApplicants = applicants.filter(a => {
             if (dateRange.start && dateRange.end && dateRangeType !== 'all') {
                return a.appliedDate >= dateRange.start && a.appliedDate <= dateRange.end;
            }
            return true;
        });
        
        return positions.map(pos => {
            // --- ⬇️ (수정) 사이트 필터 로직 변경 ⬇️ ---
            const posJobs = jobs.filter(j => j.position === pos && selectedSites.includes(j.site));
            // --- ⬆️ (수정) ⬆️ ---
            const jobIds = posJobs.map(j => j.id);
            const posApplicants = dateFilteredApplicants.filter(a => jobIds.includes(a.appliedJobId));
            
            const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
            posApplicants.forEach(a => {
                totals.applications++;
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
                if (['합격', '입사'].includes(a.status)) totals.offers++;
                if (a.status === '입사') totals.hires++;
            });
            return { position: pos, ...totals };
        });
    }, [jobs, applicants, dateRange, dateRangeType, siteFilter, selectedSites]); // 의존성 수정


    return (
        <div className="p-4 md:p-8">
            {showSettingsModal && (
                <DashboardSettingsModal settings={widgetSettings} onSave={handleSaveWidgetSettings} onClose={() => setShowSettingsModal(false)} />
            )}

            <div className="hidden md:flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
                    {/* --- ⬇️ (수정) 헤더 텍스트 로직 변경 ⬇️ --- */}
                    <p className="text-gray-600">
                        {selectedSites.length === 3 ? '전체 사이트' : selectedSites.join(', ')}
                        {selectedPositions.length === 2 ? ' | 전체 유형' : ` | ${selectedPositions.join(', ')}`}
                        {dateRangeType !== 'all' ? ` | ${dateRange.start} ~ ${dateRange.end}` : ' | 전체 기간'}
                    </p>
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                 </div>
                <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                    <Icon name="settings" size={24} />
                </button>
            </div>

            {/* --- ⬇️ (수정) 필터 바 레이아웃 및 항목 전체 변경 ⬇️ --- */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    
                    {/* 1. 기간 필터 그룹 */}
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

                    {/* 2. 사이트 필터 그룹 */}
                    <div>
                        <label className="label-style">사이트</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={selectedSites.length === 3} onChange={handleSelectAllSites} /> <span><b>전체</b></span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={siteFilter['사람인']} onChange={() => handleSiteFilterChange('사람인')} /> <span>사람인</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={siteFilter['잡코리아']} onChange={() => handleSiteFilterChange('잡코리아')} /> <span>잡코리아</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={siteFilter['인크루트']} onChange={() => handleSiteFilterChange('인크루트')} /> <span>인크루트</span></label>
                        </div>
                    </div>

                    {/* 3. 모집유형 필터 그룹 */}
                    <div>
                        <label className="label-style">모집유형</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={selectedPositions.length === 2} onChange={handleSelectAllPositions} /> <span><b>전체</b></span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={positionFilter['영업']} onChange={() => handlePositionFilterChange('영업')} /> <span>영업</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={positionFilter['강사']} onChange={() => handlePositionFilterChange('강사')} /> <span>강사</span></label>
                        </div>
                    </div>

                </div>
            </div>
            {/* --- ⬆️ (수정) ⬆️ --- */}

            {widgetSettings.kpi && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard title="진행중인 공고" value={stats.activeJobs} icon="briefcase" color="blue" />
                    <KPICard title="총 지원자" value={stats.applications} icon="users" color="green" />
                    <KPICard title="총 면접 인원" value={stats.interviews} icon="user-check" color="purple" />
                    <KPICard title="입사자" value={`${stats.hires} / ${stats.targetHires}`} icon="user-plus" color="orange" subText={targetHires > 0 ? `달성률 ${stats.achievementRate}%` : '목표 미설정'}/>
                </div>
            )}

            {widgetSettings.conversion && (
                <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <h3 className="text-xl font-semibold mb-4">전환율 분석</h3>
                    <div className="flex items-center justify-around flex-wrap gap-4">
                        <ConversionStep label="조회" value={stats.views} /> <Icon name="chevron-right" className="text-gray-400" />
                        <ConversionStep label="지원" value={stats.applications} /> <Icon name="chevron-right" className="text-gray-400" />
                        <ConversionStep label="컨택" value={stats.contacts} /> <Icon name="chevron-right" className="text-gray-400" />
                        <ConversionStep label="면접" value={stats.interviews} /> <Icon name="chevron-right" className="text-gray-400" />
                        <ConversionStep label="합격" value={stats.offers} /> <Icon name="chevron-right" className="text-gray-400" />
                        <ConversionStep label="입사" value={stats.hires} />
                    </div>
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">총 전환율 (지원자 → 입사자)</p>
                        <p className="text-4xl font-bold text-blue-600">{stats.conversionRate}%</p>
                    </div>
                </div>
            )}

            {widgetSettings.siteSummary && (
                 <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold">사이트별 현황</h3>
                        {widgetSettings.siteChart && (
                            <button onClick={() => setShowSiteChart(!showSiteChart)} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                                <Icon name={showSiteChart ? 'chevron-up' : 'chevron-down'} size={16} className="mr-1" />
                                차트 {showSiteChart ? '숨기기' : '보기'}
                            </button>
                        )}
                    </div>
                    {/* --- ⬇️ (수정) SiteSummary filter prop 로직 변경 ⬇️ --- */}
                    <SiteSummary 
                        jobs={jobs} 
                        dailyRecords={dailyRecords} 
                        applicants={applicants} 
                        filter={selectedSites.length === 1 ? selectedSites[0] : null} 
                    />
                    {/* --- ⬆️ (수정) ⬆️ --- */}

                    {widgetSettings.siteChart && showSiteChart && (
                        <div className="mt-6 border-t pt-6">
                            <h4 className="text-lg font-semibold mb-4">사이트별 성과 비교 (전체 기간)</h4>
                             <div className="radar-chart-container">
                                <ChartComponent
                                    type="radar"
                                    data={radarChartData}
                                    options={{
                                        elements: { line: { borderWidth: 3 } },
                                        scales: { r: { angleLines: { display: false }, suggestedMin: 0 } },
                                        plugins: { legend: { position: 'top' } }
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">모집유형별 현황</h3>
                <p className="text-sm text-gray-500 -mt-2 mb-4">
                    {/* --- ⬇️ (수정) 헤더 텍스트 로직 변경 ⬇️ --- */}
                    (기준: {selectedSites.length === 3 ? '전체 사이트' : selectedSites.join(', ')} | {dateRangeType === 'all' ? '전체 기간' : `${dateRange.start} ~ ${dateRange.end}`})
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {positionSummaryData.map(data => (
                        <div key={data.position} className="border border-gray-200 rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-3">{data.position}</h4>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                <div className="stat-item"><span className="stat-label">지원자:</span><span className="font-semibold">{data.applications}</span></div>
                                <div className="stat-item"><span className="stat-label">컨택:</span><span className="font-semibold">{data.contacts}</span></div>
                                <div className="stat-item"><span className="stat-label">면접:</span><span className="font-semibold">{data.interviews}</span></div>
                                <div className="stat-item"><span className="stat-label">합격:</span><span className="font-semibold">{data.offers}</span></div>
                                <div className="flex justify-between col-span-2 border-t pt-2 mt-1"><span className="text-gray-600 font-bold">입사:</span><span className="font-bold text-lg text-blue-600">{data.hires}명</span></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
};
