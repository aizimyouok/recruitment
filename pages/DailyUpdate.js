// --- 조회수 업데이트 ---
const { useState, useMemo, useEffect } = React;
// db, alert, Input, Button은 전역으로 로드됩니다.

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
        const newPrevViews = {}, newCurrentViews = {}, newRecordsForDate = {};
        for (const job of activeJobs) {
            const jobRecordsBefore = recordsBefore.filter(r => r.jobId === job.id);
            const jobRecordsOn = recordsOn.filter(r => r.jobId === job.id);
            const prevTotalViews = jobRecordsBefore.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            const increaseOnDate = jobRecordsOn.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
            newPrevViews[job.id] = prevTotalViews;
            newCurrentViews[job.id] = prevTotalViews + increaseOnDate;
            newRecordsForDate[job.id] = jobRecordsOn.map(r => r.id);
        }
        setPreviousViews(newPrevViews); setViewInputs(newCurrentViews); setRecordsForDate(newRecordsForDate);
    }, [selectedDate, dailyRecords, activeJobs]);

    const handleChange = (jobId, value) => { setViewInputs(prev => ({ ...prev, [jobId]: value === '' ? '' : (parseInt(value) || 0) })); };
    const handleSubmit = async () => {
        setIsSaving(true);
        try {
            const batch = db.batch();
            for (const [jobId, currentViewInput] of Object.entries(viewInputs)) {
                const recordsToDelete = recordsForDate[jobId] || [];
                recordsToDelete.forEach(docId => batch.delete(db.collection('dailyRecords').doc(docId)));
                const prevTotal = previousViews[jobId] || 0;
                const currentTotal = currentViewInput || 0;
                const increase = currentTotal - prevTotal;
                if (increase !== 0) {
                    const docRef = db.collection('dailyRecords').doc();
                    batch.set(docRef, { jobId, date: selectedDate, viewsIncrease: increase, createdAt: new Date().toISOString() });
                }
            }
            await batch.commit(); alert('조회수가 저장되었습니다!'); loadData();
        } catch (error) { alert('저장 실패: ' + error.message); }
        finally { setIsSaving(false); }
    };

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
                {activeJobs.map(job => (
                    <div key={job.id} className="bg-white rounded-xl shadow-lg p-6">
                        <div className="mb-4"><h3 className="text-lg font-semibold text-gray-800">{job.title}</h3><p className="text-sm text-gray-600">{job.site} | {job.position}</p></div>
                        <div><label className="label-style mb-1">조회수 (누적)</label><Input type="number" min="0" value={viewInputs[job.id] ?? ''} onChange={(e) => handleChange(job.id, e.target.value)} className="w-full md:w-1/2 lg:w-1/3" placeholder="0" /><p className="text-xs text-gray-500 mt-1">(어제까지 누적: {previousViews[job.id] || 0})</p></div>
                    </div>
                ))}
            </div>
            {activeJobs.length === 0 && <div className="text-center py-12 text-gray-500">진행중인 공고가 없습니다.</div>}
        </div>
    );
};
