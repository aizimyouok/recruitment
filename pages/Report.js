// --- 리포트 ---
const { useState, useMemo, useCallback } = React;
// Icon, Input, Select, Button, ChartComponent, ConversionStep, ApplicantStatusBadge 등은 전역 로드됩니다.

const Report = ({ jobs, dailyRecords, applicants, siteSettings }) => {
    // 1. 필터 상태
    const [filters, setFilters] = useState({
        dateRangeType: 'all',
        customRange: { start: '', end: '' },
        siteFilter: { '사람인': true, '잡코리아': true, '인크루트': true },
        // --- ⬇️ (수정) '기타' 제거 ⬇️ ---
        positionFilter: { '영업': true, '강사': true },
        jobFilter: 'all'
    });

    // 2. 리포트 섹션 선택 상태
    const [sections, setSections] = useState({
        funnel: true,
        roi: true,
        trends: true,
        positionAnalysis: true,
        demographics: true,
        rawData: true,
    });
    
    // 3. 상세 목록 컬럼 선택 상태
    const [columns, setColumns] = useState({
        name: true,
        jobTitle: true,
        position: true,
        appliedDate: true,
        status: true,
        gender: true,
        age: true,
        contactInfo: false,
    });
    const handleColumnToggle = (key) => setColumns(prev => ({ ...prev, [key]: !prev[key] }));

    // 4. 생성된 리포트 데이터 상태
    const [reportData, setReportData] = useState(null);
    
    // 필터 변경 핸들러
    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };
    
    // 사이트 필터 핸들러
    const handleSiteFilterChange = (siteKey) => {
        setFilters(prev => {
            const newSiteFilter = { ...prev.siteFilter, [siteKey]: !prev.siteFilter[siteKey] };
            return { ...prev, siteFilter: newSiteFilter, jobFilter: 'all' };
        });
    };
    const handleSelectAllSites = (e) => {
        const isChecked = e.target.checked;
        setFilters(prev => ({ ...prev, siteFilter: { '사람인': isChecked, '잡코리아': isChecked, '인크루트': isChecked }, jobFilter: 'all' }));
    };
    const selectedSites = useMemo(() => Object.keys(filters.siteFilter).filter(key => filters.siteFilter[key]), [filters.siteFilter]);

    // '모집유형' 필터 핸들러
    const handlePositionFilterChange = (posKey) => {
        setFilters(prev => {
            const newPosFilter = { ...prev.positionFilter, [posKey]: !prev.positionFilter[posKey] };
            return { ...prev, positionFilter: newPosFilter, jobFilter: 'all' };
        });
    };
    const handleSelectAllPositions = (e) => {
        const isChecked = e.target.checked;
        // --- ⬇️ (수정) '기타' 제거 ⬇️ ---
        setFilters(prev => ({ ...prev, positionFilter: { '영업': isChecked, '강사': isChecked }, jobFilter: 'all' }));
    };
    const selectedPositions = useMemo(() => Object.keys(filters.positionFilter).filter(key => filters.positionFilter[key]), [filters.positionFilter]);
    // --- ⬆️ (수정) ⬆️ ---

    const jobIdToJob = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {});
    }, [jobs]);

    const dateRange = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (filters.dateRangeType === 'week') {
            const weekAgo = new Date(new Date().setDate(today.getDate() - 7));
            return { start: weekAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (filters.dateRangeType === 'month') {
            const monthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
            return { start: monthAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (filters.dateRangeType === 'custom' && filters.customRange.start && filters.customRange.end) {
            return filters.customRange;
        }
        return { start: null, end: todayStr };
    }, [filters.dateRangeType, filters.customRange]);

    // 리포트 생성 로직
    const handleGenerateReport = () => {
        // --- 1. 데이터 필터링 ---
        
        const filteredJobs = jobs.filter(j => 
            (selectedSites.includes(j.site)) &&
            (selectedPositions.includes(j.position)) && 
            (filters.jobFilter === 'all' || j.id === filters.jobFilter)
        );
        const jobIds = filteredJobs.map(j => j.id);
        
        const applyDateFilter = (items, dateField) => {
            if (dateRange.start && dateRange.end && filters.dateRangeType !== 'all') {
                return items.filter(item => 
                    item[dateField] >= dateRange.start && item[dateField] <= dateRange.end
                );
            }
            return items;
        };
        
        const applicantsInJobs = applicants.filter(a => jobIds.includes(a.appliedJobId));
        const recordsInJobs = dailyRecords.filter(r => jobIds.includes(r.jobId));

        const filteredApplicants = applyDateFilter(applicantsInJobs, 'appliedDate');
        const filteredRecords = applyDateFilter(recordsInJobs, 'date');

        // --- 2. 리포트 데이터 계산 ---
        let newReportData = {};

        // (제안 1: 채용 퍼널)
        if (sections.funnel) {
            const totalViews = filteredRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const totals = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
            filteredApplicants.forEach(a => {
                totals.applications++;
                if (['컨택', '면접', '합격', '입사'].includes(a.status)) totals.contacts++;
                if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
                if (['합격', '입사'].includes(a.status)) totals.offers++;
                if (a.status === '입사') totals.hires++;
            });
            const rates = {
                viewToApp: totalViews > 0 ? ((totals.applications / totalViews) * 100).toFixed(1) : 0,
                appToContact: totals.applications > 0 ? ((totals.contacts / totals.applications) * 100).toFixed(1) : 0,
                contactToInterview: totals.contacts > 0 ? ((totals.interviews / totals.contacts) * 100).toFixed(1) : 0,
                interviewToOffer: totals.interviews > 0 ? ((totals.offers / totals.interviews) * 100).toFixed(1) : 0,
                offerToHire: totals.offers > 0 ? ((totals.hires / totals.offers) * 100).toFixed(1) : 0,
                overall: totals.applications > 0 ? ((totals.hires / totals.applications) * 100).toFixed(1) : 0,
            };
            newReportData.funnel = { kpi: { views: totalViews, ...totals }, rates };
        }
        
        // (제안 2: 비용 대비 효과)
        if (sections.roi) {
            let totalCost = 0;
            const filteredSettings = siteSettings.filter(s => selectedSites.includes(s.site));
            filteredSettings.forEach(s => { totalCost += s.monthlyCost || 0; });
            const totalHires = newReportData.funnel ? newReportData.funnel.kpi.hires : filteredApplicants.filter(a => a.status === '입사').length;
            const costPerHire = totalHires > 0 ? (totalCost / totalHires).toLocaleString(undefined, { maximumFractionDigits: 0 }) : 0;
            newReportData.roi = { totalCost: totalCost.toLocaleString(), totalHires, costPerHire };
        }

        // (제안 3: 기간별 트렌드)
        if (sections.trends) {
            const dateMap = {}; 
            filteredRecords.forEach(r => {
                const site = jobIdToJob[r.jobId]?.site;
                if (!site || !selectedSites.includes(site)) return;
                dateMap[r.date] = dateMap[r.date] || {};
                dateMap[r.date][site] = dateMap[r.date][site] || { views: 0, apps: 0 };
                dateMap[r.date][site].views += r.viewsIncrease || 0;
            });
            filteredApplicants.forEach(a => {
                const site = jobIdToJob[a.appliedJobId]?.site;
                if (!site || !selectedSites.includes(site)) return;
                dateMap[a.appliedDate] = dateMap[a.appliedDate] || {};
                dateMap[a.appliedDate][site] = dateMap[a.appliedDate][site] || { views: 0, apps: 0 };
                dateMap[a.appliedDate][site].apps++;
            });

            const allDates = Object.keys(dateMap).sort();
            const lineChartDatasets = [];
            const colors = {
                '사람인': { views: 'rgb(59, 130, 246)', apps: 'rgb(34, 197, 94)' },
                '잡코리아': { views: 'rgb(245, 158, 11)', apps: 'rgb(234, 179, 8)' },
                '인크루트': { views: 'rgb(139, 92, 246)', apps: 'rgb(217, 70, 239)' },
            };
            selectedSites.forEach(site => {
                lineChartDatasets.push({
                    label: `${site} - 조회수`,
                    data: allDates.map(date => dateMap[date][site]?.views || 0),
                    borderColor: colors[site]?.views || 'rgb(0,0,0)',
                    tension: 0.1, borderDash: [5, 5]
                });
                lineChartDatasets.push({
                    label: `${site} - 지원자`,
                    data: allDates.map(date => dateMap[date][site]?.apps || 0),
                    borderColor: colors[site]?.apps || 'rgb(100,100,100)',
                    tension: 0.1
                });
            });
            const lineChartData = { labels: allDates, datasets: lineChartDatasets };

            const siteData = selectedSites.map(site => {
                const siteJobIds = jobs.filter(j => j.site === site).map(j => j.id);
                const siteApps = filteredApplicants.filter(a => siteJobIds.includes(a.appliedJobId));
                return { site, count: siteApps.length };
            }).filter(d => d.count > 0);
            const pieChartData = {
                labels: siteData.map(d => d.site),
                datasets: [{ data: siteData.map(d => d.count), backgroundColor: ['rgba(59, 130, 246, 0.8)', 'rgba(16, 185, 129, 0.8)', 'rgba(245, 158, 11, 0.8)'].slice(0, siteData.length) }]
            };
            newReportData.trends = { lineChartData, pieChartData };
        }
        
        // '모집유형별 분석' 섹션 데이터
        if (sections.positionAnalysis) {
            const posStats = {};
            selectedPositions.forEach(pos => {
                posStats[pos] = { applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
            });
            
            filteredApplicants.forEach(a => {
                const pos = jobIdToJob[a.appliedJobId]?.position;
                if (pos && posStats[pos]) {
                    posStats[pos].applications++;
                    if (['컨택', '면접', '합격', '입사'].includes(a.status)) posStats[pos].contacts++;
                    if (['면접', '합격', '입사'].includes(a.status)) posStats[pos].interviews++;
                    if (['합격', '입사'].includes(a.status)) posStats[pos].offers++;
                    if (a.status === '입사') posStats[pos].hires++;
                }
            });

            const posPieData = {
                labels: Object.keys(posStats),
                datasets: [{ 
                    data: Object.values(posStats).map(d => d.applications),
                    // --- ⬇️ (수정) '기타' 색상(회색) 제거 ⬇️ ---
                    backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(234, 179, 8, 0.8)'].slice(0, Object.keys(posStats).length) 
                }]
            };
            newReportData.positionAnalysis = { pieChartData: posPieData, summaryData: posStats };
        }

        // (제안 4: 지원자 통계)
        if (sections.demographics) {
            const gender = { '남': 0, '여': 0 };
            const ageGroups = { '20대 미만': 0, '20대': 0, '30대': 0, '40대': 0, '50대 이상': 0 };
            filteredApplicants.forEach(a => {
                if (a.gender === '남') gender['남']++;
                else if (a.gender === '여') gender['여']++;
                const age = a.age;
                if (age) {
                    if (age < 20) ageGroups['20대 미만']++;
                    else if (age < 30) ageGroups['20대']++;
                    else if (age < 40) ageGroups['30대']++;
                    else if (age < 50) ageGroups['40대']++;
                    else ageGroups['50대 이상']++;
                }
            });
            newReportData.demographics = { gender, ageGroups };
        }

        // (제안 5: 상세 데이터)
        if (sections.rawData) {
            newReportData.rawData = {
                applicants: filteredApplicants.map(a => {
                    const job = jobIdToJob[a.appliedJobId];
                    return { ...a, jobTitle: job?.title || 'N/A', position: job?.position || 'N/A' };
                })
            };
        }

        setReportData(newReportData);
    };
    
    // 필터링된 공고 목록 (select용)
    const availableJobs = useMemo(() => {
        return jobs.filter(j => selectedSites.includes(j.site) && selectedPositions.includes(j.position));
    }, [jobs, selectedSites, selectedPositions]);

    // 리포트 제목 생성
    const reportTitle = useMemo(() => {
        let title = "채용 리포트";
        let parts = [];
        
        if (filters.dateRangeType === 'all' || !dateRange.start) { parts.push("전체 기간"); } 
        else { parts.push(`${dateRange.start} ~ ${dateRange.end}`); }
        
        if (selectedSites.length < 3) parts.push(selectedSites.join(', '));
        else parts.push("전체 사이트");
        
        // --- ⬇️ (수정) '기타' 제거 ⬇️ ---
        if (selectedPositions.length < 2) parts.push(selectedPositions.join(', '));
        else parts.push("전체 유형");
        // --- ⬆️ (수정) ⬆️ ---

        if (filters.jobFilter !== 'all') {
            const job = jobs.find(j => j.id === filters.jobFilter);
            parts.push(job ? job.title : "선택된 공고");
        }
        return `${title} (${parts.join(" | ")})`;
    }, [filters, jobs, dateRange, selectedSites, selectedPositions]);

    return (
        <div className="p-4 md:p-8">
            {/* --- 1. 설정 패널 (인쇄 시 숨김) --- */}
            <div className="no-print">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800">리포트</h2>
                    <Button variant="primary" onClick={handleGenerateReport} className="flex items-center space-x-2">
                        <Icon name="search" size={18} /> <span>리포트 생성</span>
                    </Button>
                </div>

                {/* 필터 설정 */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                    <h3 className="text-xl font-semibold mb-4">1. 필터 설정</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* 날짜 필터 */}
                        <div>
                            <label className="label-style">기간</label>
                            <Select value={filters.dateRangeType} onChange={(e) => handleFilterChange('dateRangeType', e.target.value)}>
                                <option value="all">전체 기간</option>
                                <option value="week">최근 1주</option>
                                <option value="month">최근 1개월</option>
                                <option value="custom">기간 선택</option>
                            </Select>
                            {filters.dateRangeType === 'custom' && (
                                <div className="flex items-center space-x-2 mt-2">
                                    <Input type="date" value={filters.customRange.start} onChange={(e) => handleFilterChange('customRange', {...filters.customRange, start: e.target.value})} />
                                    <span>~</span>
                                    <Input type="date" value={filters.customRange.end} onChange={(e) => handleFilterChange('customRange', {...filters.customRange, end: e.target.value})} />
                                </div>
                            )}
                        </div>
                        
                        {/* 사이트 필터 */}
                        <div>
                            <label className="label-style">사이트</label>
                            <div className="space-y-2 mt-2">
                                <label className="flex items-center space-x-2"><input type="checkbox" checked={selectedSites.length === 3} onChange={handleSelectAllSites} className="h-4 w-4" /> <span><b>전체 선택</b></span></label>
                                {Object.keys(filters.siteFilter).map(siteKey => (
                                     <label key={siteKey} className="flex items-center space-x-2 ml-4">
                                        <input type="checkbox" checked={filters.siteFilter[siteKey]} onChange={() => handleSiteFilterChange(siteKey)} className="h-4 w-4" /> <span>{siteKey}</span>
                                     </label>
                                ))}
                            </div>
                        </div>

                        {/* '모집유형' 필터 */}
                        <div>
                            <label className="label-style">모집유형</label>
                            <div className="space-y-2 mt-2">
                                {/* --- ⬇️ (수정) '기타' 제거 ⬇️ --- */}
                                <label className="flex items-center space-x-2"><input type="checkbox" checked={selectedPositions.length === 2} onChange={handleSelectAllPositions} className="h-4 w-4" /> <span><b>전체 선택</b></span></label>
                                {Object.keys(filters.positionFilter).map(posKey => (
                                     <label key={posKey} className="flex items-center space-x-2 ml-4">
                                        <input type="checkbox" checked={filters.positionFilter[posKey]} onChange={() => handlePositionFilterChange(posKey)} className="h-4 w-4" /> <span>{posKey}</span>
                                     </label>
                                ))}
                                {/* --- ⬆️ (수정) ⬆️ --- */}
                            </div>
                        </div>

                        {/* 공고 필터 */}
                        <div>
                            <label className="label-style">공고 (선택한 필터 기준)</label>
                            <Select value={filters.jobFilter} onChange={(e) => handleFilterChange('jobFilter', e.target.value)}>
                                <option value="all">전체 공고 ({availableJobs.length}개)</option>
                                {availableJobs.map(job => (
                                    <option key={job.id} value={job.id}>{job.title} ({job.site} / {job.position})</option>
                                ))}
                            </Select>
                        </div>
                    </div>
                </div>
                
                {/* 섹션 선택 */}
                <div className="bg-white rounded-xl shadow-lg p-4 mb-8">
                    <h3 className="text-xl font-semibold mb-4">2. 포함할 리포트 항목</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.funnel} onChange={() => handleSectionToggle('funnel')} className="h-5 w-5" /> <span>채용 퍼널</span></label>
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.roi} onChange={() => handleSectionToggle('roi')} className="h-5 w-5" /> <span>비용 대비 효과</span></label>
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.trends} onChange={() => handleSectionToggle('trends')} className="h-5 w-5" /> <span>사이트 트렌드</span></label>
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.positionAnalysis} onChange={() => handleSectionToggle('positionAnalysis')} className="h-5 w-5" /> <span>모집유형 분석</span></label>
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.demographics} onChange={() => handleSectionToggle('demographics')} className="h-5 w-5" /> <span>지원자 통계</span></label>
                        <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg"><input type="checkbox" checked={sections.rawData} onChange={() => handleSectionToggle('rawData')} className="h-5 w-5" /> <span>상세 데이터</span></label>
                    </div>
                </div>
            </div>

            {/* --- 2. 리포트 결과 (인쇄 영역) --- */}
            {reportData && (
                <div className="report-print-area bg-white rounded-xl shadow-2xl p-6 md:p-10">
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-800">{reportTitle}</h2>
                            <p className="text-gray-600">생성일: {new Date().toLocaleString()}</p>
                        </div>
                        <Button variant="secondary" onClick={() => window.print()} className="no-print flex items-center space-x-2">
                            <Icon name="printer" size={18} /> <span>인쇄하기</span>
                        </Button>
                    </div>
                    
                    <div className="space-y-10">
                        {/* 섹션 1: 채용 퍼널 */}
                        {sections.funnel && reportData.funnel && (
                            <ReportSection title="채용 퍼널 분석">
                                <div className="flex items-center justify-around flex-wrap gap-4 p-4 bg-gray-50 rounded-lg mb-6">
                                    <ConversionStep label="조회" value={reportData.funnel.kpi.views} /> <Icon name="chevron-right" />
                                    <ConversionStep label="지원" value={reportData.funnel.kpi.applications} /> <Icon name="chevron-right" />
                                    <ConversionStep label="컨택" value={reportData.funnel.kpi.contacts} /> <Icon name="chevron-right" />
                                    <ConversionStep label="면접" value={reportData.funnel.kpi.interviews} /> <Icon name="chevron-right" />
                                    <ConversionStep label="합격" value={reportData.funnel.kpi.offers} /> <Icon name="chevron-right" />
                                    <ConversionStep label="입사" value={reportData.funnel.kpi.hires} />
                                </div>
                                <h4 className="text-lg font-semibold mb-3">단계별 전환율</h4>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <StatBox label="지원 → 컨택" value={`${reportData.funnel.rates.appToContact}%`} />
                                    <StatBox label="컨택 → 면접" value={`${reportData.funnel.rates.contactToInterview}%`} />
                                    <StatBox label="면접 → 합격" value={`${reportData.funnel.rates.interviewToOffer}%`} />
                                    <StatBox label="합격 → 입사" value={`${reportData.funnel.rates.offerToHire}%`} />
                                    <StatBox label="총 전환율 (지원→입사)" value={`${reportData.funnel.rates.overall}%`} className="col-span-2 md:col-span-4 bg-blue-50 text-blue-700" />
                                </div>
                            </ReportSection>
                        )}
                        
                        {/* 섹션 2: 비용 대비 효과 */}
                        {sections.roi && reportData.roi && (
                            <ReportSection title="비용 대비 효과 (ROI)">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <StatBox label="총 이용료 (월 기준)" value={`${reportData.roi.totalCost}원`} />
                                    <StatBox label="총 입사자 수" value={`${reportData.roi.totalHires}명`} />
                                    <StatBox label="1인당 채용 비용 (Cost Per Hire)" value={reportData.roi.costPerHire > 0 ? `${reportData.roi.costPerHire}원` : '-'} className="bg-purple-50 text-purple-700" />
                                </div>
                            </ReportSection>
                        )}

                        {/* 섹션 3: 기간별 트렌드 */}
                        {sections.trends && reportData.trends && (
                            <ReportSection title="사이트별 트렌드">
                                <h4 className="text-lg font-semibold mb-3">일별 조회수 및 지원자 추이 (사이트별)</h4>
                                <div className="w-full h-64 mb-6"><ChartComponent type="line" data={reportData.trends.lineChartData} options={{ scales: { y: { beginAtZero: true } } }} /></div>
                                <h4 className="text-lg font-semibold mb-3">사이트별 지원자 비율</h4>
                                <div className="w-full h-64"><ChartComponent type="pie" data={reportData.trends.pieChartData} options={{ plugins: { datalabels: { display: true, color: 'white', font: { weight: 'bold', size: 12 }, formatter: (value, ctx) => { const dataset = ctx.chart.data.datasets[0]; const total = dataset.data.reduce((acc, data) => acc + data, 0); const percentage = (value * 100 / total).toFixed(1) + '%'; return `${value}명\n(${percentage})`; } }, tooltip: { callbacks: { label: (ctx) => { const label = ctx.label || ''; const value = ctx.raw || 0; const dataset = ctx.dataset.data; const total = dataset.reduce((acc, data) => acc + data, 0); const percentage = (value * 100 / total).toFixed(1) + '%'; return `${label}: ${value}명 (${percentage})`; } } } } }} /></div>
                            </ReportSection>
                        )}
                        
                        {/* '모집유형별 분석' 섹션 */}
                        {sections.positionAnalysis && reportData.positionAnalysis && (
                             <ReportSection title="모집유형별 분석">
                                <h4 className="text-lg font-semibold mb-3">모집유형별 지원자 비율</h4>
                                <div className="w-full h-64 mb-6"><ChartComponent type="pie" data={reportData.positionAnalysis.pieChartData} options={{ plugins: { datalabels: { display: true, color: 'white', font: { weight: 'bold', size: 12 }, formatter: (value, ctx) => { const dataset = ctx.chart.data.datasets[0]; const total = dataset.data.reduce((acc, data) => acc + data, 0); const percentage = (value * 100 / total).toFixed(1) + '%'; return `${value}명\n(${percentage})`; } }, tooltip: { callbacks: { label: (ctx) => { const label = ctx.label || ''; const value = ctx.raw || 0; const dataset = ctx.dataset.data; const total = dataset.reduce((acc, data) => acc + data, 0); const percentage = (value * 100 / total).toFixed(1) + '%'; return `${label}: ${value}명 (${percentage})`; } } } } }} /></div>
                                
                                <h4 className="text-lg font-semibold mb-3">모집유형별 현황</h4>
                                {/* --- ⬇️ (수정) grid-cols-2로 변경 ⬇️ --- */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(reportData.positionAnalysis.summaryData).map(([pos, data]) => (
                                        <div key={pos} className="border border-gray-200 rounded-lg p-4">
                                            <h5 className="font-semibold text-lg mb-3">{pos}</h5>
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
                             </ReportSection>
                        )}

                        {/* 섹션 4: 지원자 통계 */}
                        {sections.demographics && reportData.demographics && (
                            <ReportSection title="지원자 통계">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">성별 분포</h4>
                                        <div className="space-y-2">
                                            {Object.entries(reportData.demographics.gender).filter(([key, value]) => value > 0).map(([key, value]) => (
                                                <div key={key} className="flex justify-between p-3 bg-gray-50 rounded"><span>{key}</span><span className="font-bold">{value}명</span></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-semibold mb-3">연령대 분포</h4>
                                        <div className="space-y-2">
                                            {Object.entries(reportData.demographics.ageGroups).filter(([key, value]) => value > 0).map(([key, value]) => (
                                                <div key={key} className="flex justify-between p-3 bg-gray-50 rounded"><span>{key}</span><span className="font-bold">{value}명</span></div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </ReportSection>
                        )}

                        {/* 섹션 5: 상세 데이터 */}
                        {sections.rawData && reportData.rawData && (
                            <ReportSection title="상세 지원자 목록">
                                <div className="no-print mb-4 p-4 border rounded-lg">
                                    <h5 className="font-semibold mb-2">테이블 컬럼 표시/숨기기</h5>
                                    <div className="flex flex-wrap gap-4">
                                        {Object.keys(columns).map(colKey => (
                                            <label key={colKey} className="flex items-center space-x-2">
                                                <input type="checkbox" checked={columns[colKey]} onChange={() => handleColumnToggle(colKey)} className="h-4 w-4" />
                                                <span>{ {name: '이름', jobTitle: '지원 공고', position: '모집유형', appliedDate: '지원일', status: '상태', gender: '성별', age: '나이', contactInfo: '연락처'}[colKey] }</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="overflow-x-auto" style={{maxHeight: '400px'}}>
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0">
                                            <tr>
                                                {columns.name && <th className="th-style">이름</th>}
                                                {columns.jobTitle && <th className="th-style">지원 공고</th>}
                                                {columns.position && <th className="th-style">모집유형</th>}
                                                {columns.appliedDate && <th className="th-style">지원일</th>}
                                                {columns.status && <th className="th-style">상태</th>}
                                                {columns.gender && <th className="th-style">성별</th>}
                                                {columns.age && <th className="th-style">나이</th>}
                                                {columns.contactInfo && <th className="th-style">연락처</th>}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {reportData.rawData.applicants.map(a => (
                                                <tr key={a.id}>
                                                    {columns.name && <td className="td-style">{a.name}</td>}
                                                    {columns.jobTitle && <td className="td-style">{a.jobTitle}</td>}
                                                    {columns.position && <td className="td-style">{a.position}</td>}
                                                    {columns.appliedDate && <td className="td-style">{a.appliedDate}</td>}
                                                    {columns.status && <td className="td-style"><ApplicantStatusBadge status={a.status} /></td>}
                                                    {columns.gender && <td className="td-style">{a.gender}</td>}
                                                    {columns.age && <td className="td-style">{a.age}</td>}
                                                    {columns.contactInfo && <td className="td-style">{a.contactInfo}</td>}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {reportData.rawData.applicants.length === 0 && <p className="text-center text-gray-500 py-4">데이터가 없습니다.</p>}
                            </ReportSection>
                        )}
                    </div>
                </div>
            )}
            
            {/* 리포트 생성 전 안내 메시지 */}
            {!reportData && (
                <div className="text-center py-20 text-gray-500">
                    <Icon name="file-text" size={48} className="mx-auto mb-4" />
                    <p>리포트 설정을 선택하고 '리포트 생성' 버튼을 눌러주세요.</p>
                </div>
            )}
        </div>
    );
};

// 리포트 섹션 래퍼
const ReportSection = ({ title, children }) => (
    <section className="report-section border-t pt-6">
        <h3 className="text-2xl font-bold text-gray-700 mb-6">{title}</h3>
        {children}
    </section>
);

// 간단한 통계 박스
const StatBox = ({ label, value, className = "" }) => (
    <div className={`p-4 bg-gray-50 rounded-lg ${className}`}>
        <p className="text-sm text-gray-600">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
    </div>
);
