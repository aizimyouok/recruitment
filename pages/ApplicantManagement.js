// --- 지원자 관리 ---
const { useState, useMemo, useEffect, useCallback } = React;
// db, alert, confirm, Icon, Select, Input, Textarea, Button, ApplicantStatusBadge는 전역으로 로드됩니다.

const ApplicantManagement = ({ applicants, jobs, loadData }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingApplicant, setEditingApplicant] = useState(null);
    const [formData, setFormData] = useState({ name: '', gender: '남', age: '', contactInfo: '', appliedJobId: '', appliedDate: new Date().toISOString().split('T')[0], status: '지원', memo: '' });
    
    // --- ⬇️ (수정) 필터 상태: 'jobId'를 'sites'와 'positions' (다중 선택)으로 변경 ⬇️ ---
    const [filters, setFilters] = useState({
        sites: { '사람인': true, '잡코리아': true, '인크루트': true },
        positions: { '영업': true, '강사': true },
        status: 'all'
    });
    // --- ⬆️ (수정) ⬆️ ---

    const [searchTerm, setSearchTerm] = useState('');

    const activeJobs = useMemo(() => jobs.filter(j => j.status === '진행중'), [jobs]);
    const applicantStatuses = ['지원', '컨택', '면접', '합격', '입사', '불합격'];

    useEffect(() => {
        if (!editingApplicant && activeJobs.length > 0 && !formData.appliedJobId) {
            setFormData(prev => ({ ...prev, appliedJobId: activeJobs[0].id }));
        }
    }, [activeJobs, editingApplicant, formData.appliedJobId]);

    // --- ⬇️ (추가) 다중 선택 필터 핸들러 ⬇️ ---
    const handleSiteFilterChange = (siteKey) => {
        setFilters(prev => ({
            ...prev,
            sites: { ...prev.sites, [siteKey]: !prev.sites[siteKey] }
        }));
    };
    const handleSelectAllSites = (e) => {
        const isChecked = e.target.checked;
        setFilters(prev => ({
            ...prev,
            sites: { '사람인': isChecked, '잡코리아': isChecked, '인크루트': isChecked }
        }));
    };
    
    const handlePositionFilterChange = (posKey) => {
        setFilters(prev => ({
            ...prev,
            positions: { ...prev.positions, [posKey]: !prev.positions[posKey] }
        }));
    };
    const handleSelectAllPositions = (e) => {
        const isChecked = e.target.checked;
        setFilters(prev => ({
            ...prev,
            positions: { '영업': isChecked, '강사': isChecked }
        }));
    };
    
    // 선택된 필터 항목 배열 (필터링 로직용)
    const selectedSites = useMemo(() => Object.keys(filters.sites).filter(key => filters.sites[key]), [filters.sites]);
    const selectedPositions = useMemo(() => Object.keys(filters.positions).filter(key => filters.positions[key]), [filters.positions]);
    
    // 공고 ID로 공고 정보(사이트, 유형)를 찾기 위한 맵
    const jobIdToJob = useMemo(() => {
        return jobs.reduce((acc, job) => {
            acc[job.id] = job;
            return acc;
        }, {});
    }, [jobs]);
    // --- ⬆️ (추가) ⬆️ ---

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.appliedJobId) { alert('지원 공고를 선택해주세요.'); return; }
        try {
            const data = { ...formData, age: Number(formData.age) || null, updatedAt: new Date().toISOString() };
            if (editingApplicant) await db.collection('applicants').doc(editingApplicant.id).update(data);
            else await db.collection('applicants').add({ ...data, createdAt: new Date().toISOString() });
            resetForm(); loadData(); 
            if (window.showToast) window.showToast('저장되었습니다!', 'success');
            else alert('저장되었습니다!');
        } catch (error) { 
            if (window.showToast) window.showToast('저장 실패: ' + error.message, 'error');
            else alert('저장 실패: ' + error.message); 
        }
    };

    const handleEdit = (applicant) => {
        setEditingApplicant(applicant);
        setFormData({ name: applicant.name || '', gender: applicant.gender || '남', age: applicant.age || '', contactInfo: applicant.contactInfo || '', appliedJobId: applicant.appliedJobId || '', appliedDate: applicant.appliedDate || new Date().toISOString().split('T')[0], status: applicant.status || '지원', memo: applicant.memo || '' });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (confirm('정말 삭제하시겠습니까? 지원자 정보가 영구적으로 삭제됩니다.')) {
            try { 
                await db.collection('applicants').doc(id).delete(); 
                loadData(); 
                if (window.showToast) window.showToast('삭제되었습니다!', 'success');
                else alert('삭제되었습니다!');
            }
            catch (error) { 
                if (window.showToast) window.showToast('삭제 실패: ' + error.message, 'error');
                else alert('삭제 실패: ' + error.message); 
            }
        }
    };

    const resetForm = () => {
        setShowForm(false); setEditingApplicant(null);
        setFormData({ name: '', gender: '남', age: '', contactInfo: '', appliedJobId: activeJobs.length > 0 ? activeJobs[0].id : '', appliedDate: new Date().toISOString().split('T')[0], status: '지원', memo: '' });
    };

    const handleStatusChange = async (applicantId, newStatus) => {
        try { 
            await db.collection('applicants').doc(applicantId).update({ status: newStatus, updatedAt: new Date().toISOString() }); 
            loadData(); 
        }
        catch (error) { 
            if (window.showToast) window.showToast('상태 변경 실패: ' + error.message, 'error');
            else alert('상태 변경 실패: ' + error.message); 
        }
    };

    // --- ⬇️ (수정) 필터링 로직 (filteredApplicants) ⬇️ ---
    const filteredApplicants = useMemo(() => {
        return applicants.filter(a => {
            const job = jobIdToJob[a.appliedJobId];
            // 지원한 공고 정보가 없는 경우 (예: 공고 삭제됨)
            if (!job) return false; 
            
            // 1. 사이트 필터
            const siteMatch = selectedSites.includes(job.site);
            // 2. 모집유형 필터
            const positionMatch = selectedPositions.includes(job.position);
            // 3. 상태 필터
            const statusMatch = filters.status === 'all' || a.status === filters.status;
            // 4. 이름 검색 필터
            const nameMatch = searchTerm === '' || (a.name && a.name.toLowerCase().includes(searchTerm.toLowerCase()));
            
            return siteMatch && positionMatch && statusMatch && nameMatch;
        });
    }, [applicants, filters, searchTerm, jobIdToJob, selectedSites, selectedPositions]); // 의존성 업데이트
    // --- ⬆️ (수정) ⬆️ ---

    const getJobTitle = useCallback((jobId) => jobIdToJob[jobId]?.title || 'N/A', [jobIdToJob]);
    const getJobPosition = useCallback((jobId) => jobIdToJob[jobId]?.position || 'N/A', [jobIdToJob]);

    return (
        <div className="p-4 md:p-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-800">지원자 관리</h2>
                <button onClick={() => setShowForm(true)} className="btn-primary px-4 py-2 md:px-6 md:py-3 flex items-center space-x-2 mt-4 md:mt-0">
                    <Icon name="user-plus" size={20} /> <span>지원자 추가</span>
                </button>
            </div>

            {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <h3 className="text-2xl font-bold mb-6">{editingApplicant ? '지원자 수정' : '지원자 추가'}</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                             <div><label className="label-style">이름</label><Input type="text" name="name" value={formData.name} onChange={handleInputChange} required /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div><label className="label-style">성별</label><Select name="gender" value={formData.gender} onChange={handleInputChange}><option>남</option><option>여</option></Select></div>
                                <div><label className="label-style">나이</label><Input type="number" name="age" value={formData.age} onChange={handleInputChange} placeholder="숫자만 입력" /></div>
                            </div>
                            <div><label className="label-style">연락처</label><Input type="text" name="contactInfo" value={formData.contactInfo} onChange={handleInputChange} /></div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-style">지원 공고</label>
                                    <Select name="appliedJobId" value={formData.appliedJobId} onChange={handleInputChange} required>
                                        <option value="">-- 공고 선택 --</option>
                                        {activeJobs.map(job => 
                                            <option key={job.id} value={job.id}>{job.title} ({job.position})</option>
                                        )}
                                    </Select>
                                </div>
                                <div><label className="label-style">지원 날짜</label><Input type="date" name="appliedDate" value={formData.appliedDate} onChange={handleInputChange} required /></div>
                            </div>
                             <div><label className="label-style">현재 상태</label><Select name="status" value={formData.status} onChange={handleInputChange}>{applicantStatuses.map(status => <option key={status} value={status}>{status}</option>)}</Select></div>
                            <div><label className="label-style">메모</label><Textarea name="memo" value={formData.memo} onChange={handleInputChange} rows="3" /></div>
                            <div className="flex space-x-4"><Button type="submit" variant="primary" className="flex-1">{editingApplicant ? '수정' : '추가'}</Button><Button type="button" variant="secondary" className="flex-1" onClick={resetForm}>취소</Button></div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- ⬇️ (수정) 필터 바 레이아웃 및 항목 전체 변경 ⬇️ --- */}
            <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
                <div className="flex flex-wrap items-start gap-x-6 gap-y-4">
                    {/* 1. 이름 검색 */}
                    <div className="min-w-0 w-full sm:w-auto md:w-64">
                        <label className="label-style">이름 검색</label>
                        <Input type="text" placeholder="이름 검색..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    
                    {/* 2. 모집유형 필터 */}
                    <div>
                        <label className="label-style">모집유형</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={selectedPositions.length === 2} onChange={handleSelectAllPositions} /> <span><b>전체</b></span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={filters.positions['영업']} onChange={() => handlePositionFilterChange('영업')} /> <span>영업</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={filters.positions['강사']} onChange={() => handlePositionFilterChange('강사')} /> <span>강사</span></label>
                        </div>
                    </div>

                    {/* 3. 사이트 필터 */}
                    <div>
                        <label className="label-style">지원사이트</label>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2">
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={selectedSites.length === 3} onChange={handleSelectAllSites} /> <span><b>전체</b></span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={filters.sites['사람인']} onChange={() => handleSiteFilterChange('사람인')} /> <span>사람인</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={filters.sites['잡코리아']} onChange={() => handleSiteFilterChange('잡코리아')} /> <span>잡코리아</span></label>
                            <label className="flex items-center space-x-2"><input type="checkbox" className="h-4 w-4" checked={filters.sites['인크루트']} onChange={() => handleSiteFilterChange('인크루트')} /> <span>인크루트</span></label>
                        </div>
                    </div>

                    {/* 4. 상태 필터 */}
                    <div>
                        <label className="label-style">상태</label>
                        <Select value={filters.status} onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))} className="filter-select">
                            <option value="all">모든 상태</option>
                            {applicantStatuses.map(status => <option key={status} value={status}>{status}</option>)}
                        </Select>
                    </div>
                </div>
            </div>
            {/* --- ⬆️ (수정) ⬆️ --- */}

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50"><tr><th className="th-style">이름</th><th className="th-style">성별</th><th className="th-style">나이</th><th className="th-style">연락처</th><th className="th-style">지원 공고</th><th className="th-style">모집유형</th><th className="th-style">지원일</th><th className="th-style">상태</th><th className="th-style">작업</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredApplicants.map(applicant => (
                                <tr key={applicant.id} className="hover:bg-gray-50">
                                    <td className="td-style table-cell-nowrap">{applicant.name}</td><td className="td-style table-cell-nowrap">{applicant.gender}</td><td className="td-style table-cell-nowrap">{applicant.age}</td>
                                    <td className="td-style table-cell-nowrap">{applicant.contactInfo}</td><td className="td-style table-cell-nowrap">{getJobTitle(applicant.appliedJobId)}</td>
                                    <td className="td-style table-cell-nowrap">{getJobPosition(applicant.appliedJobId)}</td>
                                    <td className="td-style table-cell-nowrap">{applicant.appliedDate}</td>
                                    <td className="td-style table-cell-nowrap"><Select value={applicant.status} onChange={(e) => handleStatusChange(applicant.id, e.target.value)} className="p-1 text-xs w-24">{applicantStatuses.map(s => <option key={s} value={s}>{s}</option>)}</Select></td>
                                    <td className="td-style table-cell-nowrap"><div className="flex space-x-2"><button onClick={() => handleEdit(applicant)} className="text-blue-600 hover:text-blue-800"><Icon name="edit" size={16} /></button><button onClick={() => handleDelete(applicant.id)} className="text-red-600 hover:text-red-800"><Icon name="trash-2" size={16} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {applicants.length === 0 && <div className="text-center py-12 text-gray-500">등록된 지원자가 없습니다.</div>}
                {applicants.length > 0 && filteredApplicants.length === 0 && <div className="text-center py-12 text-gray-500">필터 결과와 일치하는 지원자가 없습니다.</div>}
            </div>
        </div>
    );
};
