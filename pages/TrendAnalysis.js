// --- 트렌드 분석 ---
const { useState, useMemo } = React;
// Input, ChartComponent는 전역으로 로드됩니다.

const TrendAnalysis = ({ jobs, dailyRecords, applicants }) => {
    const [period, setPeriod] = useState('week');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // --- ⬇️ (추가) '모집유형' 필터 상태 ⬇️ ---
    const [positionFilter, setPositionFilter] = useState('all');

    // --- ⬇️ (수정) '모집유형' 필터를 반영하도록 데이터 필터링 ⬇️ ---
    const filteredData = useMemo(() => {
        // 1. '모집유형'에 따라 공고 ID 필터링
        const filteredJobs = jobs.filter(j => positionFilter === 'all' || j.position === positionFilter);
        const jobIds = filteredJobs.map(j => j.id);

        // 2. 필터링된 공고 ID를 기준으로 레코드와 지원자 필터링
        let filteredRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
        let filteredApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
        
        // 3. 기간 필터 적용
        if (period !== 'all') {
            let startDt, endDt = new Date();
            if (period === 'custom' && startDate && endDate) { startDt = new Date(startDate); endDt = new Date(endDate); }
            else { startDt = new Date(); let daysBack = 7; if (period === 'month') daysBack = 30; if (period === 'quarter') daysBack = 90; startDt.setDate(endDt.getDate() - daysBack); }
            const startStr = startDt.toISOString().split('T')[0]; const endStr = endDt.toISOString().split('T')[0];
            
            filteredRecords = filteredRecords.filter(r => r.date >= startStr && r.date <= endStr);
            filteredApplicants = filteredApplicants.filter(a => a.appliedDate >= startStr && a.appliedDate <= endStr);
        }
        
        return { filteredRecords, filteredApplicants };
    }, [jobs, dailyRecords, applicants, period, startDate, endDate, positionFilter]); // 'positionFilter' 의존성 추가

    // 일별 트렌드 데이터
    const trendData = useMemo(() => {
        const { filteredRecords, filteredApplicants } = filteredData;
        
        const dateMap = {};
        filteredRecords.forEach(record => { if (!dateMap[record.date]) dateMap[record.date] = { date: record.date, views: 0, applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 }; dateMap[record.date].views += record.viewsIncrease || 0; });
        filteredApplicants.forEach(applicant => { 
            const date = applicant.appliedDate; 
            if (!dateMap[date]) dateMap[date] = { date: date, views: 0, applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 }; 
            dateMap[date].applications++; 
            if (['컨택', '면접', '합격', '입사'].includes(applicant.status)) dateMap[date].contacts++;
            if (['면접', '합격', '입사'].includes(applicant.status)) dateMap[date].interviews++;
            if (['합격', '입사'].includes(applicant.status)) dateMap[date].offers++;
            if (applicant.status === '입사') dateMap[date].hires++;
        });
        return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
    }, [filteredData]); // 'filteredData'로 의존성 변경

    // 사이트별 비율 데이터
    const siteTrendData = useMemo(() => {
        const { filteredApplicants } = filteredData; // '모집유형'과 '기간'이 필터링된 지원자 사용
        const sites = ['사람인', '잡코리아', '인크루트'];
        
        // jobIdToSite 맵 생성
        const jobIdToSite = jobs.reduce((acc, job) => {
            acc[job.id] = job.site;
            return acc;
        }, {});

        const siteCounts = { '사람인': 0, '잡코리아': 0, '인크루트': 0 };
        
        filteredApplicants.forEach(a => {
            const site = jobIdToSite[a.appliedJobId];
            if (site && siteCounts.hasOwnProperty(site)) {
                siteCounts[site]++;
            }
        });
        
        return sites.map(site => ({ site, applications: siteCounts[site] }));
    }, [jobs, filteredData]); // 'filteredData'로 의존성 변경

    const lineChartData = {
        labels: trendData.map(d => d.date),
        datasets: [ 
            { label: '조회수', data: trendData.map(d => d.views), borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.1)', tension: 0.4 }, 
            { label: '지원자', data: trendData.map(d => d.applications), borderColor: 'rgb(16, 185, 129)', backgroundColor: 'rgba(16, 185, 129, 0.1)', tension: 0.4 }, 
            { label: '컨택', data: trendData.map(d => d.contacts), borderColor: 'rgb(234, 179, 8)', backgroundColor: 'rgba(234, 179, 8, 0.1)', tension: 0.4 }, 
            { label: '면접', data: trendData.map(d => d.interviews), borderColor: 'rgb(139, 92, 246)', backgroundColor: 'rgba(139, 92, 246, 0.1)', tension: 0.4 },
            { label: '합격', data: trendData.map(d => d.offers), borderColor: 'rgb(217, 70, 239)', backgroundColor: 'rgba(217, 70, 239, 0.1)', tension: 0.4 },
            { label: '입사자', data: trendData.map(d => d.hires), borderColor: 'rgb(245, 158, 11)', backgroundColor: 'rgba(245, 158, 11, 0.1)', tension: 0.4 } 
        ]
    };
    const pieChartData = { labels: siteTrendData.map(d => d.site), datasets: [{ data: siteTrendData.map(d => d.applications), backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'] }] };

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">트렌드 분석</h2>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setPeriod('week')} className={`btn-period ${period === 'week' ? 'btn-period-active' : ''}`}>최근 1주일</button><button onClick={() => setPeriod('month')} className={`btn-period ${period === 'month' ? 'btn-period-active' : ''}`}>최근 1개월</button>
                        <button onClick={() => setPeriod('quarter')} className={`btn-period ${period === 'quarter' ? 'btn-period-active' : ''}`}>최근 3개월</button><button onClick={() => setPeriod('custom')} className={`btn-period ${period === 'custom' ? 'btn-period-active' : ''}`}>기간 선택</button>
                    </div>
                    {period === 'custom' && (<div className="flex items-center space-x-2"><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="py-2" /><span>~</span><Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="py-2" /></div>)}
                    
                    {/* --- ⬇️ (추가) '모집유형' 필터 ⬇️ --- */}
                    <div className="ml-auto">
                         <Select value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)} className="px-3 py-2 text-sm font-medium">
                            <option value="all">전체 유형</option> <option value="영업">영업</option> <option value="강사">강사</option> <option value="기타">기타</option>
                        </Select>
                    </div>
                    {/* --- ⬆️ (추가) ⬆️ --- */}
                </div>
            </div>
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8"><h3 className="text-xl font-semibold mb-4">일별 채용 단계 추이</h3><div style={{ height: '350px' }}><ChartComponent type="line" data={lineChartData} options={{ scales: { y: { beginAtZero: true } } }} /></div></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">사이트별 지원자 비율</h3>
                    {/* --- ⬇️ (수정) 파이 차트 옵션 (datalabels) ⬇️ --- */}
                    <div style={{ height: '280px' }}><ChartComponent type="pie" data={pieChartData} options={{
                         plugins: {
                            datalabels: {
                                display: true,
                                color: 'white',
                                font: { weight: 'bold', size: 12 },
                                formatter: (value, ctx) => {
                                    const dataset = ctx.chart.data.datasets[0];
                                    const total = dataset.data.reduce((acc, data) => acc + data, 0);
                                    if (value === 0) return '';
                                    const percentage = (value * 100 / total).toFixed(1) + '%';
                                    return `${value}명\n(${percentage})`;
                                }
                            }
                         }
                    }} /></div>
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-4">누적 데이터 (총 지원자)</h3>
                    <div className="space-y-4">
                        {siteTrendData.map((data, index) => (<div key={data.site} className="flex items-center justify-between"><div className="flex items-center space-x-3"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: pieChartData.datasets[0].backgroundColor[index] }} /><span className="font-medium">{data.site}</span></div><span className="text-xl font-bold">{data.applications}명</span></div>))}
                    </div>
                </div>
            </div>
        </div>
    );
};
