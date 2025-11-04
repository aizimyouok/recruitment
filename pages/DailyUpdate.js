// --- 조회수 업데이트 ---
const { useState, useMemo, useEffect } = React;
// db, alert, Input, Button, Icon은 전역으로 로드됩니다.

const DailyUpdate = ({ jobs, dailyRecords, loadData }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
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
            newDailyIncreases[job.id] = increaseOnDate; 
            newRecordsForDate[job.id] = jobRecordsOn.map(r => r.id);
        }
        setPreviousViews(newPrevViews); 
        setViewInputs(newDailyIncreases); 
        setRecordsForDate(newRecordsForDate); 

    }, [selectedDate, dailyRecords, activeJobs]);

    const handleChange = (jobId, value) => { 
        setViewInputs(prev => ({ ...prev, [jobId]: value === '' ? '' : (parseInt(value) || 0) })); 
    };

    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            for (const [jobId, dailyIncreaseInput] of Object.entries(viewInputs)) {
                const recordsToDelete = recordsForDate[jobId] || [];
                recordsToDelete.forEach(docId => batch.delete(db.collection('dailyRecords').doc(docId)));
                const increase = dailyIncreaseInput || 0;
                if (increase !== 0) {
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
    
    // --- ⬇️ (수정) 날짜 변경 함수 추가 ⬇️ ---
    const handleDateChange = (days) => {
        let currentDate = new Date(selectedDate);
        if (isNaN(currentDate.getTime())) {
            currentDate = new Date(); // 혹시 날짜가 유효하지 않으면 오늘 날짜로
        }
        currentDate.setDate(currentDate.getDate() + days);
        setSelectedDate(currentDate.toISOString().split('T')[0]);
    };
    // --- ⬆️ (수정) ⬆️ ---

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">조회수 업데이트</h2>
                    {/* --- ⬇️ (수정) 날짜 입력 UI에 화살표 버튼 추가 ⬇️ --- */}
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
                    {/* --- ⬆️ (수정) ⬆️ --- */}
                </div>
                {activeJobs.length > 0 && <Button onClick={handleSubmit} disabled={isSaving} variant="primary" className="mt-4 md:mt-0 w-full md:w-auto">{isSaving ? '저장 중...' : '조회수 저장'}</Button>}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {activeJobs.map(job => {
                    const prevTotal = previousViews[job.id] || 0;
                    const dailyIncrease = viewInputs[job.id] ?? ''; 
                    const currentTotal = prevTotal + (parseInt(dailyIncrease) || 0); 

                    return (
                        <div key={job.id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.site} | 모집유형: {job.position}</p>
                            </div>
                            <div>
                                <label className="label-style mb-1">일일 조회수 (증가분)</label>
                                <Input 
                                    type="number" 
                                    min="0" 
                                    value={dailyIncrease} 
                                    onChange={(e) => handleChange(job.id, e.target.value)} 
                                    className="w-full md:w-48" 
                                    placeholder="0" 
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    (어제까지 누적: {prevTotal}) + (오늘 증가: {dailyIncrease || 0}) = (총 누적: {currentTotal})
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            {activeJobs.length === 0 && <div className="text-center py-12 text-gray-500">진행중인 공고가 없습니다.</div>}
        </div>
    );
};
