// --- 설정 ---
const { useState, useEffect } = React;
// db, alert, Input, Select, Button은 전역으로 로드됩니다.

const Settings = ({ siteSettings, goals, loadData }) => {
    const [activeTab, setActiveTab] = useState('sites');
    const [siteForm, setSiteForm] = useState({ site: '사람인', monthlyCost: 0, quarterlyCost: 0, startDate: '' });
    const [goalForm, setGoalForm] = useState({ yearMonth: '', targetHires: 0, targetSaramin: 0, targetJobkorea: 0, targetIncruit: 0 });

    useEffect(() => {
        if (activeTab === 'sites') { const existing = siteSettings.find(s => s.site === '사람인'); setSiteForm(existing || { site: '사람인', monthlyCost: 0, quarterlyCost: 0, startDate: '' }); }
        else if (activeTab === 'goals') { const today = new Date().toISOString().substring(0, 7); const existing = goals.find(g => g.yearMonth === today); setGoalForm(existing || { yearMonth: today, targetHires: 0, targetSaramin: 0, targetJobkorea: 0, targetIncruit: 0 }); }
    }, [activeTab, siteSettings, goals]);

    const handleSiteSubmit = async (e) => {
        e.preventDefault(); try { const existing = siteSettings.find(s => s.site === siteForm.site); const data = { ...siteForm, monthlyCost: Number(siteForm.monthlyCost), quarterlyCost: Number(siteForm.quarterlyCost) }; if (existing) await db.collection('siteSettings').doc(existing.id).update(data); else await db.collection('siteSettings').add(data); alert('저장되었습니다!'); loadData(); } catch (error) { alert('저장 실패: ' + error.message); }
    };
    const handleGoalSubmit = async (e) => {
        e.preventDefault(); try { const existing = goals.find(g => g.yearMonth === goalForm.yearMonth); const data = { ...goalForm, targetHires: Number(goalForm.targetHires), targetSaramin: Number(goalForm.targetSaramin), targetJobkorea: Number(goalForm.targetJobkorea), targetIncruit: Number(goalForm.targetIncruit) }; if (existing) await db.collection('goals').doc(existing.id).update(data); else await db.collection('goals').add(data); alert('저장되었습니다!'); loadData(); } catch (error) { alert('저장 실패: ' + error.message); }
    };

    return (
        <div className="p-4 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-8">설정</h2>
            <div className="flex space-x-2 mb-6">
                <button onClick={() => setActiveTab('sites')} className={`btn-tab ${activeTab === 'sites' ? 'btn-tab-active' : ''}`}>사이트 이용료</button>
                <button onClick={() => setActiveTab('goals')} className={`btn-tab ${activeTab === 'goals' ? 'btn-tab-active' : ''}`}>목표 설정</button>
            </div>
            {activeTab === 'sites' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-6">사이트 이용료 설정</h3>
                    <form onSubmit={handleSiteSubmit} className="space-y-4 max-w-2xl">
                        <div><label className="label-style">채용 사이트</label><Select value={siteForm.site} onChange={(e) => { const site = e.target.value; const existing = siteSettings.find(s => s.site === site); setSiteForm(existing || { site, monthlyCost: 0, quarterlyCost: 0, startDate: '' }); }}><option>사람인</option><option>잡코리아</option><option>인크루트</option></Select></div>
                        <div><label className="label-style">월 이용료 (원)</label><Input type="number" value={siteForm.monthlyCost} onChange={(e) => setSiteForm({...siteForm, monthlyCost: e.target.value})} /></div>
                        <div><label className="label-style">분기 이용료 (원)</label><Input type="number" value={siteForm.quarterlyCost} onChange={(e) => setSiteForm({...siteForm, quarterlyCost: e.target.value})} /></div>
                        <div><label className="label-style">과금 시작일</label><Input type="date" value={siteForm.startDate} onChange={(e) => setSiteForm({...siteForm, startDate: e.target.value})} /></div>
                        <Button type="submit" variant="primary" className="w-full">저장</Button>
                    </form>
                    <div className="mt-8">
                        <h4 className="font-semibold mb-4">현재 설정</h4>
                        <div className="space-y-3">{siteSettings.map(setting => (<div key={setting.id} className="border border-gray-200 rounded-lg p-4"><h5 className="font-semibold text-lg">{setting.site}</h5><p className="text-sm text-gray-600 mt-1">월 {setting.monthlyCost?.toLocaleString()}원 / 분기 {setting.quarterlyCost?.toLocaleString()}원</p>{setting.startDate && <p className="text-sm text-gray-600">시작일: {setting.startDate}</p>}</div>))}</div>
                    </div>
                </div>
            )}
            {activeTab === 'goals' && (
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-semibold mb-6">월별 목표 설정</h3>
                    <form onSubmit={handleGoalSubmit} className="space-y-4 max-w-2xl">
                        <div><label className="label-style">년월</label><Input type="month" value={goalForm.yearMonth} onChange={(e) => { const yearMonth = e.target.value; const existing = goals.find(g => g.yearMonth === yearMonth); setGoalForm(existing || { yearMonth, targetHires: 0, targetSaramin: 0, targetJobkorea: 0, targetIncruit: 0 }); }} required /></div>
                        <div><label className="label-style">월 채용 목표 인원</label><Input type="number" value={goalForm.targetHires} onChange={(e) => setGoalForm({...goalForm, targetHires: e.target.value})} /></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="label-style">사람인 목표</label><Input type="number" value={goalForm.targetSaramin} onChange={(e) => setGoalForm({...goalForm, targetSaramin: e.target.value})} /></div>
                            <div><label className="label-style">잡코리아 목표</label><Input type="number" value={goalForm.targetJobkorea} onChange={(e) => setGoalForm({...goalForm, targetJobkorea: e.target.value})} /></div>
                            <div><label className="label-style">인크루트 목표</label><Input type="number" value={goalForm.targetIncruit} onChange={(e) => setGoalForm({...goalForm, targetIncruit: e.target.value})} /></div>
                        </div>
                        <Button type="submit" variant="primary" className="w-full">저장</Button>
                    </form>
                    <div className="mt-8">
                        <h4 className="font-semibold mb-4">설정된 목표</h4>
                        <div className="space-y-3">{goals.sort((a,b) => b.yearMonth.localeCompare(a.yearMonth)).map(goal => (<div key={goal.id} className="border border-gray-200 rounded-lg p-4"><h5 className="font-semibold text-lg mb-2">{goal.yearMonth}</h5><div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm"><div><span className="text-gray-600">총 목표</span><p className="goal-value text-blue-600">{goal.targetHires}명</p></div><div><span className="text-gray-600">사람인</span><p className="goal-value">{goal.targetSaramin}명</p></div><div><span className="text-gray-600">잡코리아</span><p className="goal-value">{goal.targetJobkorea}명</p></div><div><span className="text-gray-600">인크루트</span><p className="goal-value">{goal.targetIncruit}명</p></div></div></div>))}</div>
                    </div>
                </div>
            )}
        </div>
    );
};
