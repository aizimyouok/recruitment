// --- 공고 관리 ---
const { useState } = React;
// db, alert, confirm, Icon, Select, Input, Textarea, Button, JobDetailModal은 전역으로 로드됩니다.

const JobManagement = ({ jobs, applicants, loadData }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [selectedJob, setSelectedJob] = useState(null);
    
    const [formData, setFormData] = useState({ site: '사람인', title: '', position: '', company: '', startDate: '', endDate: '', status: '진행중', memo: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = { ...formData, updatedAt: new Date().toISOString() };
            if (editingJob) await db.collection('jobs').doc(editingJob.id).update(data);
            else await db.collection('jobs').add({ ...data, createdAt: new Date().toISOString() });
            resetForm(); loadData(); alert('저장되었습니다!');
        } catch (error) { alert('저장 실패: ' + error.message); }
    };
    const handleEdit = (e, job) => { e.stopPropagation(); setEditingJob(job); setFormData(job); setShowForm(true); };
    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (confirm('정말 삭제하시겠습니까?')) {
            try { await db.collection('jobs').doc(id).delete(); loadData(); alert('삭제되었습니다!'); }
            catch (error) { alert('삭제 실패: ' + error.message); }
        }
    };
    
    const resetForm = () => { setShowForm(false); setEditingJob(null); setFormData({ site: '사람인', title: '', position: '', company: '', startDate: '', endDate: '', status: '진행중', memo: '' }); };

    return (
        <div className="p-4 md:p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">공고 관리</h2>
                <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 md:px-6 md:py-3 flex items-center space-x-2">
                    <Icon name="plus" size={20} /> <span className="hidden md:inline">공고 추가</span>
                </button>
            </div>
            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">{editingJob ? '공고 수정' : '공고 추가'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div><label className="label-style">채용 사이트</label><Select name="site" value={formData.site} onChange={e => setFormData({...formData, site: e.target.value})} required><option>사람인</option><option>잡코리아</option><option>인크루트</option></Select></div>
                            <div><label className="label-style">공고 제목</label><Input type="text" name="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required /></div>
                            
                            <div>
                                <label className="label-style">모집유형</label>
                                {/* --- ⬇️ (수정) '기타' 옵션 제거 ⬇️ --- */}
                                <Select name="position" value={formData.position} onChange={e => setFormData({...formData, position: e.target.value})} required>
                                    <option value="">-- 유형 선택 --</option>
                                    <option value="영업">영업</option>
                                    <option value="강사">강사</option>
                                </Select>
                                {/* --- ⬆️ (수정) ⬆️ --- */}
                            </div>

                            <div><label className="label-style">게시 업체명</label><Input type="text" name="company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">게시 시작일</label><Input type="date" name="startDate" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} required /></div>
                                <div><label className="label-style">게시 종료일</label><Input type="date" name="endDate" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} required /></div>
                            </div>
                            <div><label className="label-style">공고 상태</label><Select name="status" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}><option>진행중</option><option>마감</option></Select></div>
                            <div><label className="label-style">메모</label><Textarea name="memo" value={formData.memo} onChange={e => setFormData({...formData, memo: e.target.value})} rows="3" /></div>
                            <div className="flex space-x-4"><Button type="submit" variant="primary" className="flex-1">{editingJob ? '수정' : '추가'}</Button><Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>취소</Button></div>
                        </form>
                    </div>
                </div>
            )}
            {selectedJob && <JobDetailModal job={selectedJob} applicants={applicants} onClose={() => setSelectedJob(null)} />}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50"><tr><th className="th-style">사이트</th><th className="th-style">공고 제목</th><th className="th-style">모집유형</th><th className="th-style">업체명</th><th className="th-style">기간</th><th className="th-style">상태</th><th className="th-style">작업</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {jobs.map(job => (
                                <tr key={job.id} className="hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedJob(job)}>
                                    <td className="td-style table-cell-nowrap"><span className="badge-blue">{job.site}</span></td><td className="td-style table-cell-nowrap">{job.title}</td>
                                    <td className="td-style table-cell-nowrap">{job.position}</td>
                                    <td className="td-style table-cell-nowrap">{job.company}</td><td className="td-style table-cell-nowrap text-sm text-gray-600">{job.startDate} ~ {job.endDate}</td>
                                    <td className="td-style table-cell-nowrap"><span className={job.status === '진행중' ? 'badge-green' : 'badge-gray'}>{job.status}</span></td>
                                    <td className="td-style table-cell-nowrap"><div className="flex space-x-2"><button onClick={(e) => handleEdit(e, job)} className="text-blue-600 hover:text-blue-800"><Icon name="edit" size={18} /></button><button onClick={(e) => handleDelete(e, job.id)} className="text-red-600 hover:text-red-800"><Icon name="trash-2" size={18} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {jobs.length === 0 && <div className="text-center py-12 text-gray-500">등록된 공고가 없습니다.</div>}
            </div>
        </div>
    );
};
