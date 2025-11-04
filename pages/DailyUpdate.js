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

    const activeJobs = useMemo(() => jobs.filter(j => j.status === '진행중'), [jobs]);

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
            // newDailyIncreases[job.id] = increaseOnDate; 
            // useEffect에서는 viewInputs를 '' (빈 문자열)로 초기화해야 자동 계산 로직이 매끄럽게 동작합니다.
            // 만약 저장된 값이 0이라면, 빈칸 대신 0이 표시됩니다.
            newDailyIncreases[job.id] = increaseOnDate === 0 ? 0 : (increaseOnDate || '');
            newRecordsForDate[job.id] = jobRecordsOn.map(r => r.id);
        }
        setPreviousViews(newPrevViews); 
        setViewInputs(newDailyIncreases); 
        setRecordsForDate(newRecordsForDate); 

    }, [selectedDate, dailyRecords, activeJobs]);

    // --- ⬇️ (수정) '일일 증가분' 입력 핸들러 ⬇️ ---
    const handleDailyChange = (jobId, dailyValue) => {
        const dailyIncrease = dailyValue === '' ? '' : (parseInt(dailyValue) || 0);
        setViewInputs(prev => ({ ...prev, [jobId]: dailyIncrease })); 
    };
    // --- ⬆️ (수정) ⬆️ ---

    // --- ⬇️ (수정) '총 누적' 입력 핸들러 추가 ⬇️ ---
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
    // --- ⬆️ (수정) ⬆️ ---


    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            for (const [jobId, dailyIncreaseInput] of Object.entries(viewInputs)) {
                const recordsToDelete = recordsForDate[jobId] || [];
                recordsToDelete.forEach(docId => batch.delete(db.collection('dailyRecords').doc(docId)));
                
                // dailyIncreaseInput이 ''(빈 문자열)이면 0으로, 아니면 해당 숫자로 저장
                const increase = parseInt(dailyIncreaseInput) || 0; 
                
                if (increase !== 0 || recordsToDelete.length > 0) { // 0을 저장하거나, 기존 값을 삭제해야 하는 경우
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
                    // --- ⬇️ (수정) 입력값/표시값 계산 로직 ⬇️ ---
                    const prevTotal = previousViews[job.id] || 0;
                    // dailyIncrease는 '', 0, 10 등 숫자거나 빈 문자열일 수 있습니다.
                    const dailyIncrease = viewInputs[job.id] ?? ''; 
                    
                    let displayTotal;
                    if (dailyIncrease === '') {
                        // 일일 증가분이 비어있으면, 총 누적도 비어있는 것처럼 표시
                        displayTotal = '';
                    } else {
                        // 일일 증가분이 숫자(0 포함)이면, 총 누적 계산
                        displayTotal = prevTotal + (parseInt(dailyIncrease) || 0);
                    }
                    // --- ⬆️ (수정) ⬆️ ---

                    return (
                        <div key={job.id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.site} | 모집유형: {job.position}</p>
                            </div>
                            
                            {/* --- ⬇️ (수정) 입력 UI 변경 ⬇️ --- */}
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
                                        placeholder={prevTotal.toString()} // 기본값으로 어제 누적 표시
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                (어제까지 누적: {prevTotal})
                            </p>
                            {/* --- ⬆️ (수정) ⬆️ --- */}
                        </div>
                    );
                })}
            </div>
            
            {activeJobs.length === 0 && <div className="text-center py-12 text-gray-500">진행중인 공고가 없습니다.</div>}
        </div>
    );
};
