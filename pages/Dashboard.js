// --- 대시보드 ---
const { useState, useMemo } = React;
// Icon, ChartComponent, DashboardSettingsModal, KPICard, ConversionStep, SiteSummary, Input, Select 등
// 필요한 컴포넌트들은 index.html에서 전역으로 로드됩니다.

const Dashboard = ({ jobs, dailyRecords, applicants, siteSettings, goals }) => {
    const [dateRangeType, setDateRangeType] = useState('all');
    const [customRange, setCustomRange] = useState({ start: '', end: '' });
    const [siteFilter, setSiteFilter] = useState('all');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [widgetSettings, setWidgetSettings] = useState(() => {
        const saved = localStorage.getItem('dashboardWidgetSettings');
        return saved ? JSON.parse(saved) : { kpi: true, conversion: true, siteSummary: true, siteChart: true };
    });
    const [showSiteChart, setShowSiteChart] = useState(widgetSettings.siteChart);

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
        const filteredJobs = siteFilter === 'all' ? jobs : jobs.filter(j => j.site === siteFilter);
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
    }, [jobs, dailyRecords, applicants, siteFilter, dateRange, dateRangeType]);

    const stats = useMemo(() => {
        const activeJobs = filteredData.filteredJobs.filter(j => j.status === '진행중');
        const totalViews = filteredData.filteredRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
        const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 }; // ✅ contacts 추가
        filteredData.filteredApplicants.forEach(a => {
            totals.applications++;
            // ✅ '컨택' 상태 집계 추가
            if (a.status === '컨택') totals.contacts++;
            if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
            if (['합격', '입사'].includes(a.status)) totals.offers++;
            if (a.status === '입사') totals.hires++;
        });

        const conversionRate = totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0;

        const targetYearMonth = dateRange.end.substring(0, 7);
        const currentGoal = goals.find(g => g.yearMonth === targetYearMonth);
        let targetHires = 0;
        if (currentGoal) {
            if (siteFilter === 'all') targetHires = currentGoal.targetHires || 0;
            else if (siteFilter === '사람인') targetHires = currentGoal.targetSaramin || 0;
            else if (siteFilter === '잡코리아') targetHires = currentGoal.targetJobkorea || 0;
            else if (siteFilter === '인크루트') targetHires = currentGoal.targetIncruit || 0;
        }
        const achievementRate = targetHires > 0 ? ((totals.hires / targetHires) * 100).toFixed(0) : 0;

        let totalCost = 0;
        const filteredSettings = siteFilter === 'all' ? siteSettings : siteSettings.filter(s => s.site === siteFilter);
        filteredSettings.forEach(s => { totalCost += s.monthlyCost || 0; });
        const costPerHire = totals.hires > 0 ? (totalCost / totals.hires).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0;

        return {
            activeJobs: activeJobs.length, views: totalViews, ...totals,
            conversionRate, targetHires, achievementRate, costPerHire
        };
    }, [filteredData, siteFilter, dateRange, goals, siteSettings]);

    // 레이더 차트 데이터
    const radarChartData = useMemo(() => {
        const sites = ['사람인', '잡코리아', '인크루트'];
        const labels = ['조회수', '지원자', '면접', '합격', '입사'];
        const datasets = sites.map((site, index) => {
            const siteJobs = jobs.filter(j => j.site === site);
            const jobIds = siteJobs.map(j => j.id);
            const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
            const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
            const views = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const applications = siteApplicants.length;
            const interviews = siteApplicants.filter(a => ['면접', '합격', '입사'].includes(a.status)).length;
            const offers = siteApplicants.filter(a => ['합격', '입사'].includes(a.status)).length;
            const hires = siteApplicants.filter(a => a.status === '입사').length;
            const data = [views, applications, interviews, offers, hires];
            const colors = ['rgba(59, 130, 246, 0.2)', 'rgba(16, 185, 129, 0.2)', 'rgba(245, 158, 11, 0.2)'];
            const borderColors = ['rgb(59, 130, 246)', 'rgb(16, 185, 129)', 'rgb(245, 158, 11)'];
            return {
                label: site, data: data, fill: true, backgroundColor: colors[index % colors.length], borderColor: borderColors[index % borderColors.length],
                pointBackgroundColor: borderColors[index % borderColors.length], pointBorderColor: '#fff', pointHoverBackgroundColor: '#fff', pointHoverBorderColor: borderColors[index % borderColors.length]
            };
        });
        return { labels, datasets };
    }, [jobs, dailyRecords, applicants]);


    return (
        <div className="p-4 md:p-8">
            {showSettingsModal && (
                <DashboardSettingsModal settings={widgetSettings} onSave={handleSaveWidgetSettings} onClose={() => setShowSettingsModal(false)} />
            )}

            <div className="hidden md:flex justify-between items-start mb-8">
                 <div>
                    <h2 className="text-3xl font-bold text-gray-800">대시보드</h2>
                    <p className="text-gray-600">
                        {siteFilter === 'all' ? '전체 사이트' : siteFilter}
                        {dateRangeType !== 'all' ? ` | ${dateRange.start} ~ ${dateRange.end}` : ' | 전체 기간'}
                    </p>
                </div>
                <button onClick={() => setShowSettingsModal(true)} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                    <Icon name="settings" size={24} />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                <div className="flex flex-wrap items-center gap-4">
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
                    <div>
                        <Select value={siteFilter} onChange={(e) => setSiteFilter(e.target.value)} className="px-3 py-2 text-sm font-medium">
                            <option value="all">전체 사이트</option> <option value="사람인">사람인</option> <option value="잡코리아">잡코리아</option> <option value="인크루트">인크루트</option>
                        </Select>
                    </div>
                </div>
            </div>

            {widgetSettings.kpi && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <KPICard title="진행중인 공고" value={stats.activeJobs} icon="briefcase" color="blue" />
                    <KPICard title="총 지원자" value={stats.applications} icon="users" color="green" />
                    <KPICard title="1인당 채용 비용 (월 기준)" value={stats.costPerHire > 0 ? `${stats.costPerHire}원` : '-'} icon="dollar-sign" color="purple" />
                    <KPICard title="입사자" value={`${stats.hires} / ${stats.targetHires}`} icon="user-plus" color="orange" subText={stats.targetHires > 0 ? `달성률 ${stats.achievementRate}%` : '목표 미설정'}/>
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
                    <SiteSummary jobs={jobs} dailyRecords={dailyRecords} applicants={applicants} filter={siteFilter === 'all' ? null : siteFilter} />

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
        </div>
    );
};
