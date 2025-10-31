// --- 사이트별 현황 ---
// (React는 전역으로 로드됩니다)
// 이 컴포넌트는 Dashboard.js에서 사용됩니다.

const SiteSummary = ({ jobs, dailyRecords, applicants, filter }) => {
    const allSites = ['사람인', '잡코리아', '인크루트'];
    const sites = filter ? [filter] : allSites;

    const siteData = sites.map(site => {
        const siteJobs = jobs.filter(j => j.site === site);
        const jobIds = siteJobs.map(j => j.id);
        const siteRecords = dailyRecords.filter(r => jobIds.includes(r.jobId));
        const totalViews = siteRecords.reduce((sum, r) => sum + (r.viewsIncrease || 0), 0);
        const siteApplicants = applicants.filter(a => jobIds.includes(a.appliedJobId));
        const totals = { jobs: siteJobs.length, views: totalViews, applications: 0, contacts: 0, interviews: 0, offers: 0, hires: 0 };
        siteApplicants.forEach(a => {
            totals.applications++;
            if (['면접', '합격', '입사'].includes(a.status)) totals.interviews++;
            if (['합격', '입사'].includes(a.status)) totals.offers++;
            if (a.status === '입사') totals.hires++;
        });
        return { site, ...totals };
    });

    return (
        <div className={`grid grid-cols-1 ${filter ? '' : 'md:grid-cols-3'} gap-4`}>
            {siteData.map(data => (
                <div key={data.site} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-lg mb-3">{data.site}</h4>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="stat-item"><span className="stat-label">공고 수:</span><span className="font-semibold">{data.jobs}</span></div>
                        <div className="stat-item"><span className="stat-label">조회수:</span><span className="font-semibold">{data.views}</span></div>
                        <div className="stat-item"><span className="stat-label">지원자:</span><span className="font-semibold">{data.applications}</span></div>
                        <div className="stat-item"><span className="stat-label">컨택:</span><span className="font-semibold">{data.contacts}</span></div>
                        <div className="stat-item"><span className="stat-label">면접:</span><span className="font-semibold">{data.interviews}</span></div>
                        <div className="stat-item"><span className="stat-label">합격:</span><span className="font-semibold">{data.offers}</span></div>
                        <div className="flex justify-between col-span-2 border-t pt-2 mt-1"><span className="text-gray-600 font-bold">입과:</span><span className="font-bold text-lg text-blue-600">{data.hires}명</span></div>
                    </div>
                </div>
            ))}
        </div>
    );
};
