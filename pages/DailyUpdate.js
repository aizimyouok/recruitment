// --- 조회수 업데이트 ---
const { useState, useMemo, useEffect } = React;
// db, alert, Input, Button, Icon은 전역으로 로드됩니다.

const DailyUpdate = ({ jobs, dailyRecords, loadData }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    // viewInputs는 '일일 증가분(daily increase)'을 저장하는 상태입니다.
    const [viewInputs, setViewInputs] = useState({}); 
    const [previousViews, setPreviousViews] = useState({}); 
    const [recordsForDate, setRecordsForDate] = useState({}); 
    const [isSaving, setIsSaving] = useState(false);

    // --- ⬇️ (수정) 'activeJobs' 정렬 로직 추가 ⬇️ ---
    const activeJobs = useMemo(() => {
        const filtered = jobs.filter(j => j.status === '진행중');

        // 정렬 순서 정의
        const siteOrder = { '사람인': 1, '잡코리아': 2, '인크루트': 3 };
        const positionOrder = { '영업': 1, '강사': 2 };

        filtered.sort((a, b) => {
            // 1. 사이트 순서로 정렬
            const siteA = siteOrder[a.site] || 99;
            const siteB = siteOrder[b.site] || 99;
            if (siteA !== siteB) {
                return siteA - siteB;
            }

            // 2. 모집유형 순서로 정렬
            const posA = positionOrder[a.position] || 99;
            const posB = positionOrder[b.position] || 99;
            return posA - posB;
        });

        return filtered;
    }, [jobs]);
    // --- ⬆️ (수정) ⬆️ ---

    // --- ⬇️ (수정) 사이트별 배경색 정의 ⬇️ ---
    const siteBgColors = {
        '사람인': 'bg-blue-50',
        '잡코리아': 'bg-green-50',
        '인크루트': 'bg-yellow-50'
    };
    // --- ⬆️ (수정) ⬆️ ---

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
                    
                    // --- ⬇️ (수정) 동적 배경색 할당 ⬇️ ---
                    const bgColor = siteBgColors[job.site] || 'bg-white';
                    // --- ⬆️ (수정) ⬆️ ---

                    return (
                        // --- ⬇️ (수정) className에 bgColor 적용 ⬇️ ---
                        <div key={job.id} className={`${bgColor} rounded-xl shadow-lg p-6`}>
                        {/* --- ⬆️ (수정) ⬆️ ---
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
        </div>
    );
};
