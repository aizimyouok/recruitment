// --- 조회수 업데이트 ---
const { useState, useMemo, useEffect } = React;
// db, alert, Input, Button, Icon, ChartComponent는 전역으로 로드됩니다.

const DailyUpdate = ({ jobs, dailyRecords, loadData }) => {
    // --- 1. 데이터 입력용 상태 ---
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [viewInputs, setViewInputs] = useState({}); 
    const [previousViews, setPreviousViews] = useState({}); 
    const [recordsForDate, setRecordsForDate] = useState({}); 
    const [isSaving, setIsSaving] = useState(false);

    // --- 2. 하단 차트용 상태 ---
    const [chartPeriod, setChartPeriod] = useState('month'); // 'week', 'month', 'all', 'custom'
    const [chartCustomRange, setChartCustomRange] = useState({ start: '', end: '' });

    // --- 정렬된 공고 목록 (데이터 입력용) ---
    const activeJobs = useMemo(() => {
        const filtered = jobs.filter(j => j.status === '진행중');
        const siteOrder = { '사람인': 1, '잡코리아': 2, '인크루트': 3 };
        const positionOrder = { '영업': 1, '강사': 2 };
        filtered.sort((a, b) => {
            const siteA = siteOrder[a.site] || 99;
            const siteB = siteOrder[b.site] || 99;
            if (siteA !== siteB) return siteA - siteB;
            const posA = positionOrder[a.position] || 99;
            const posB = positionOrder[b.position] || 99;
            return posA - posB;
        });
        return filtered;
    }, [jobs]);

    const siteBgColors = {
        '사람인': 'bg-blue-50',
        '잡코리아': 'bg-green-50',
        '인크루트': 'bg-yellow-50'
    };

    // --- 데이터 입력 UI용 useEffect ---
    useEffect(() => {
        const recordsBefore = dailyRecords.filter(r => r.date < selectedDate);
        const recordsOn = dailyRecords.filter(r => r.date === selectedDate);
        const newPrevViews = {}; 
        const newDailyIncreases = {}; 
        const newRecordsForDate = {}; 

        for (const job of activeJobs) {
            const jobRecordsBefore = recordsBefore.filter(r => r.jobId === job.id);
            const jobRecordsOn = recordsOn.filter(r => r.jobId === job.id);
            const prevTotalViews = jobRecordsBefore.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            newPrevViews[job.id] = prevTotalViews;
            const increaseOnDate = jobRecordsOn.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            newDailyIncreases[job.id] = increaseOnDate === 0 ? 0 : (increaseOnDate || '');
            newRecordsForDate[job.id] = jobRecordsOn.map(r => r.id);
        }
        setPreviousViews(newPrevViews); 
        setViewInputs(newDailyIncreases); 
        setRecordsForDate(newRecordsForDate); 

    }, [selectedDate, dailyRecords, activeJobs]);

    // --- 3. 하단 차트용 데이터 계산 ---
    
    // jobId를 '사이트-유형' 문자열로 매핑하는 맵
    const jobIdToCombo = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.id] = `${job.site}-${job.position}`;
            return acc;
        }, {});
    }, [jobs]);

    // 차트의 날짜 범위 계산
    const chartDateRange = useMemo(() => {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        if (chartPeriod === 'week') {
            const weekAgo = new Date(new Date().setDate(today.getDate() - 7));
            return { start: weekAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (chartPeriod === 'month') {
            const monthAgo = new Date(new Date().setMonth(today.getMonth() - 1));
            return { start: monthAgo.toISOString().split('T')[0], end: todayStr };
        }
        if (chartPeriod === 'custom' && chartCustomRange.start && chartCustomRange.end) {
            return chartCustomRange;
        }
        // 'all' 또는 기타
        return { start: null, end: todayStr };
    }, [chartPeriod, chartCustomRange]);

    // 차트 데이터셋 계산
    const lineChartData = useMemo(() => {
        // 1. 날짜 범위에 따라 레코드 필터링
        const filteredRecords = dailyRecords.filter(r => {
            if (chartPeriod === 'all' || !chartDateRange.start) return true;
            return r.date >= chartDateRange.start && r.date <= chartDateRange.end;
        });

        // 2. 날짜별, 콤보(사이트-유형)별 조회수 집계
        const dateMap = {};
        const combinations = {}; // 이 데이터셋에 포함된 콤보 추적

        filteredRecords.forEach(r => {
            const combo = jobIdToCombo[r.jobId];
            if (!combo) return; // '영업' 또는 '강사'가 아닌 공고 등
            
            combinations[combo] = true; // 콤보 발견!
            
            const date = r.date;
            if (!dateMap[date]) {
                dateMap[date] = { date: date };
            }
            // 해당 날짜의 콤보 값에 조회수 누적
            dateMap[date][combo] = (dateMap[date][combo] || 0) + (r.viewsIncrease || 0);
        });

        // 3. Chart.js 형식으로 정렬 및 변환
        const sortedData = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
        const labels = sortedData.map(d => d.date);
        
        const colors = {
            '사람인-영업': 'rgb(59, 130, 246)',
            '사람인-강사': 'rgb(99, 102, 241)',
            '잡코리아-영업': 'rgb(16, 185, 129)',
            '잡코리아-강사': 'rgb(34, 197, 94)',
            '인크루트-영업': 'rgb(245, 158, 11)',
            '인크루트-강사': 'rgb(234, 179, 8)',
        };
        
        const activeCombinations = Object.keys(combinations).sort();

        const datasets = activeCombinations.map(combo => ({
            label: `${combo.replace('-', '(')})`,
            data: sortedData.map(d => d[combo] || 0), // 해당 날짜에 데이터가 없으면 0
            borderColor: colors[combo] || 'rgb(100,100,100)',
            tension: 0.1,
            fill: false
        }));

        return { labels, datasets };
    }, [dailyRecords, jobIdToCombo, chartDateRange, chartPeriod]);

    const lineChartOptions = {
        scales: { 
            y: { beginAtZero: true },
            x: { 
                ticks: { 
                    autoSkip: true, 
                    maxTicksLimit: 30 // X축 레이블 최대 30개로 제한
                } 
            }
        },
        plugins: { datalabels: { display: false } },
        maintainAspectRatio: false,
        responsive: true
    };

    // --- 4. 핸들러 함수들 ---

    const handleDailyChange = (jobId, dailyValue) => {
        const dailyIncrease = dailyValue === '' ? '' : (parseInt(dailyValue) || 0);
        setViewInputs(prev => ({ ...prev, [jobId]: dailyIncrease })); 
    };

    const handleTotalChange = (jobId, totalValue) => {
        const prevTotal = previousViews[jobId] || 0;
        let newDailyIncrease;

        if (totalValue === '') {
            newDailyIncrease = '';
        } else {
            const newTotal = parseInt(totalValue) || 0;
            newDailyIncrease = newTotal - prevTotal;
        }
        setViewInputs(prev => ({ ...prev, [jobId]: newDailyIncrease }));
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            for (const [jobId, dailyIncreaseInput] of Object.entries(viewInputs)) {
                const recordsToDelete = recordsForDate[jobId] || [];
                recordsToDelete.forEach(docId => batch.delete(db.collection('dailyRecords').doc(docId)));
                
                const increase = parseInt(dailyIncreaseInput) || 0; 
                
                if (increase !== 0 || recordsToDelete.length > 0) { 
                    const docRef = db.collection('dailyRecords').doc();
                    batch.set(docRef, { 
                        jobId, 
                        date: selectedDate, 
                        viewsIncrease: increase, 
                        createdAt: new Date().toISOString() 
                    });
                }
            }
            await batch.commit(); 
            alert('조회수가 저장되었습니다!'); 
            loadData(); 
        } catch (error) { 
            alert('저장 실패: ' + error.message); 
        }
        finally { 
            setIsSaving(false); 
        }
    };
    
    const handleDateChange = (days) => {
        let currentDate = new Date(selectedDate);
        if (isNaN(currentDate.getTime())) {
            currentDate = new Date(); 
        }
        currentDate.setDate(currentDate.getDate() + days);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };

    return (
        <div className="p-4 md:p-8">
            {/* --- 데이터 입력 섹션 --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">조회수 업데이트</h2>
                    <div className="flex items-center space-x-4">
                        <label className="font-medium text-gray-700">날짜:</label>
                        <div className="flex items-center">
                            <button onClick={() => handleDateChange(-1)} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                                <Icon name="chevron-left" size={20} />
                            </button>
                            <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="mx-1" />
                            <button onClick={() => handleDateChange(1)} className="p-2 text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-100">
                                <Icon name="chevron-right" size={20} />
                            </button>
                        </div>
                    </div>
                </div>
                {activeJobs.length > 0 && <Button onClick={handleSubmit} disabled={isSaving} variant="primary" className="mt-4 md:mt-0 w-full md:w-auto">{isSaving ? '저장 중...' : '조회수 저장'}</Button>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {activeJobs.map(job => {
                    const prevTotal = previousViews[job.id] || 0;
                    const dailyIncrease = viewInputs[job.id] ?? ''; 
                    
                    let displayTotal;
                    if (dailyIncrease === '') {
                        displayTotal = '';
                    } else {
                        displayTotal = prevTotal + (parseInt(dailyIncrease) || 0);
                    }
                    
                    const bgColor = siteBgColors[job.site] || 'bg-white';

                    return (
                        <div key={job.id} className={`${bgColor} rounded-xl shadow-lg p-6`}>
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.site} | 모집유형: {job.position}</p>
                            </div>
                            
                            <div className="flex flex-wrap items-end gap-4">
                                <div>
                                    <label className="label-style mb-1">일일 조회수 (증가분)</label>
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        value={dailyIncrease} 
                                        onChange={(e) => handleDailyChange(job.id, e.target.value)} 
                                        className="w-full md:w-40" 
                                        placeholder="0" 
                                    />
                                </div>
                                <div className="text-2xl text-gray-400 pb-2">=</div>
                                <div>
                                    <label className="label-style mb-1">총 누적 조회수</label>
                                    <Input 
                                        type="number" 
                                        min={prevTotal}
                                        value={displayTotal} 
                                        onChange={(e) => handleTotalChange(job.id, e.target.value)} 
                                        className="w-full md:w-40" 
                                        placeholder={prevTotal.toString()} 
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                (어제까지 누적: {prevTotal})
                            </p>
                        </div>
                    );
                })}
            </div>
            
            {activeJobs.length === 0 && <div className="text-center py-12 text-gray-500">진행중인 공고가 없습니다.</div>}

            {/* --- ⬇️ (수정) 하단 차트 섹션 추가 ⬇️ --- */}
            <hr className="my-12" />

            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
                <h3 className="text-xl font-semibold mb-4">사이트/유형별 조회수 트렌드</h3>
                
                {/* 차트 날짜 필터 */}
                <div className="flex flex-wrap items-center gap-4 mb-6">
                    <div className="flex flex-wrap gap-2">
                        <button onClick={() => setChartPeriod('week')} className={`btn-period ${chartPeriod === 'week' ? 'btn-period-active' : ''}`}>최근 1주</button>
                        <button onClick={() => setChartPeriod('month')} className={`btn-period ${chartPeriod === 'month' ? 'btn-period-active' : ''}`}>최근 1개월</button>
                        <button onClick={() => setChartPeriod('all')} className={`btn-period ${chartPeriod === 'all' ? 'btn-period-active' : ''}`}>전체 기간</button>
                        <button onClick={() => setChartPeriod('custom')} className={`btn-period ${chartPeriod === 'custom' ? 'btn-period-active' : ''}`}>기간 선택</button>
                    </div>
                    {chartPeriod === 'custom' && (
                        <div className="flex items-center space-x-2">
                            <Input type="date" value={chartCustomRange.start} onChange={(e) => setChartCustomRange(prev => ({...prev, start: e.target.value}))} className="py-2" />
                            <span>~</span>
                            <Input type="date" value={chartCustomRange.end} onChange={(e) => setChartCustomRange(prev => ({...prev, end: e.targe.value}))} className="py-2" />
                        </div>
                    )}
                </div>

                {/* 차트 렌더링 */}
                <div style={{ height: '300px' }}>
                    {lineChartData.labels.length > 0 ? (
                        <ChartComponent 
                            type="line" 
                            data={lineChartData} 
                            options={lineChartOptions} 
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            선택한 기간의 조회수 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>
            {/* --- ⬆️ (수정) ⬆️ --- */}
        </div>
    );
};
