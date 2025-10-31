// --- 조회수 업데이트 ---
const { useState, useMemo, useEffect } = React;
// db, alert, Input, Button은 전역으로 로드됩니다.

const DailyUpdate = ({ jobs, dailyRecords, loadData }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    // --- ⬇️ (수정) 'viewInputs'가 이제 '일일 증가분'을 저장합니다. ⬇️ ---
    const [viewInputs, setViewInputs] = useState({}); // 선택한 날짜의 '일일 증가분'
    const [previousViews, setPreviousViews] = useState({}); // '어제'까지의 '누적'
    const [recordsForDate, setRecordsForDate] = useState({}); // 삭제를 위한 기존 레코드 ID
    
    const [isSaving, setIsSaving] = useState(false);

    const activeJobs = useMemo(() => jobs.filter(j => j.status === '진행중'), [jobs]);

    // --- ⬇️ (수정) 'useEffect' 로직 변경 ⬇️ ---
    useEffect(() => {
        // 1. 선택한 날짜 이전( < )의 모든 레코드
        const recordsBefore = dailyRecords.filter(r => r.date < selectedDate);
        // 2. 선택한 날짜와 동일( === )한 모든 레코드
        const recordsOn = dailyRecords.filter(r => r.date === selectedDate);
        
        const newPrevViews = {}; // '어제까지 누적'을 저장할 객체
        const newDailyIncreases = {}; // '오늘 증가분'을 저장할 객체
        const newRecordsForDate = {}; // '오늘 레코드 ID'를 저장할 객체

        for (const job of activeJobs) {
            const jobRecordsBefore = recordsBefore.filter(r => r.jobId === job.id);
            const jobRecordsOn = recordsOn.filter(r => r.jobId === job.id);

            // 1. '어제까지 누적' 조회수 계산
            const prevTotalViews = jobRecordsBefore.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            newPrevViews[job.id] = prevTotalViews;

            // 2. '오늘 증가분' 계산 (선택한 날짜에 저장된 모든 'viewsIncrease'의 합)
            const increaseOnDate = jobRecordsOn.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            newDailyIncreases[job.id] = increaseOnDate; // Input 필드에 이 값을 설정

            // 3. 저장을 위해 '오늘 레코드 ID' 목록 저장
            newRecordsForDate[job.id] = jobRecordsOn.map(r => r.id);
        }
        
        setPreviousViews(newPrevViews); // '어제까지 누적' 상태 업데이트
        setViewInputs(newDailyIncreases); // '오늘 증가분'을 Input에 설정
        setRecordsForDate(newRecordsForDate); // '오늘 레코드 ID' 상태 업데이트

    }, [selectedDate, dailyRecords, activeJobs]);
    // --- ⬆️ (수정) 'useEffect' 로직 완료 ⬆️ ---

    const handleChange = (jobId, value) => { 
        setViewInputs(prev => ({ ...prev, [jobId]: value === '' ? '' : (parseInt(value) || 0) })); 
    };

    // --- ⬇️ (수정) 'handleSubmit' 로직 변경 ⬇️ ---
    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            for (const [jobId, dailyIncreaseInput] of Object.entries(viewInputs)) {
                
                // 1. 선택한 날짜의 기존 레코드를 모두 삭제
                const recordsToDelete = recordsForDate[jobId] || [];
                recordsToDelete.forEach(docId => batch.delete(db.collection('dailyRecords').doc(docId)));

                // 2. Input에서 '일일 증가분'을 직접 가져옴
                const increase = dailyIncreaseInput || 0;

                // 3. 증가분이 0이 아닌 경우에만 새 레코드를 작성
                if (increase !== 0) {
                    const docRef = db.collection('dailyRecords').doc();
                    batch.set(docRef, { 
                        jobId, 
                        date: selectedDate, 
                        viewsIncrease: increase, // '증가분'을 DB에 그대로 저장
                        createdAt: new Date().toISOString() 
                    });
                }
            }
            await batch.commit(); 
            alert('조회수가 저장되었습니다!'); 
            loadData(); // 데이터 새로고침
        } catch (error) { 
            alert('저장 실패: ' + error.message); 
        }
        finally { 
            setIsSaving(false); 
        }
    };
    // --- ⬆️ (수정) 'handleSubmit' 로직 완료 ⬆️ ---

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">조회수 업데이트</h2>
                    <div className="flex items-center space-x-4"><label className="font-medium text-gray-700">날짜:</label><Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} /></div>
                </div>
                {activeJobs.length > 0 && <Button onClick={handleSubmit} disabled={isSaving} variant="primary" className="mt-4 md:mt-0 w-full md:w-auto">{isSaving ? '저장 중...' : '조회수 저장'}</Button>}
            </div>
            <div className="space-y-4 mb-8">
                
                {/* --- ⬇️ (수정) JSX 렌더링 부분 변경 ⬇️ --- */}
                {activeJobs.map(job => {
                    // 계산 로직을 map 안으로 이동
                    const prevTotal = previousViews[job.id] || 0;
                    const dailyIncrease = viewInputs[job.id] ?? ''; // Input 값 (오늘 증가분)
                    const currentTotal = prevTotal + (parseInt(dailyIncrease) || 0); // 오늘 총 누적

                    return (
                        <div key={job.id} className="bg-white rounded-xl shadow-lg p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold text-gray-800">{job.title}</h3>
                                <p className="text-sm text-gray-600">{job.site} | {job.position}</p>
                            </div>
                            <div>
                                <label className="label-style mb-1">일일 조회수 (증가분)</label>
                                <Input 
                                    type="number" 
                                    min="0" 
                                    value={dailyIncrease} 
                                    onChange={(e) => handleChange(job.id, e.target.value)} 
                                    className="w-full md:w-1/2 lg:w-1/3" 
                                    placeholder="0" 
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    (어제까지 누적: {prevTotal}) + (오늘 증가: {dailyIncrease || 0}) = (총 누적: {currentTotal})
                                </p>
                            </div>
                        </div>
                    );
                })}
                {/* --- ⬆️ (수정) JSX 렌더링 부분 완료 ⬆️ --- */}

            </div>
            {activeJobs.length === 0 && <div className="text-center py-12 text-gray-500">진행중인 공고가 없습니다.</div>}
        </div>
    );
};
