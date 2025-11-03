// --- Helper Components & Styles ---
// 이 파일은 여러 곳에서 공통으로 사용하는 작은 UI 컴포넌트들을 모아둡니다.

// 1. 폼 컨트롤 컴포넌트
const Input = ({ className, ...props }) => <input className={`input-style ${className}`} {...props} />;
const Select = ({ className, ...props }) => <select className={`input-style bg-white ${className}`} {...props} />;
const Textarea = ({ className, ...props }) => <textarea className={`input-style ${className}`} {...props} />;

// 2. 버튼 컴포넌트
const Button = ({ variant = 'primary', className, children, ...props }) => {
    const baseStyle = "px-6 py-2 rounded-lg font-semibold transition-colors shadow disabled:opacity-50 text-sm md:text-base md:py-3";
    const variants = { primary: "bg-blue-600 text-white hover:bg-blue-700", secondary: "bg-gray-300 text-gray-700 hover:bg-gray-400", danger: "bg-red-600 text-white hover:bg-red-700" };
    return <button className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

// 3. 지원자 상태 배지
const ApplicantStatusBadge = ({ status }) => {
    const colors = { 
        '지원': 'badge-blue', 
        '중복': 'badge-gray',   
        '컨택': 'badge-yellow',
        '면접': 'bg-purple-100 text-purple-800', 
        '합격': 'badge-green', 
        '입사': 'bg-emerald-100 text-emerald-800', 
        // --- ⬇️ (수정) '거절', '취소' 스타일 추가 ⬇️ ---
        '거절': 'badge-red',
        '취소': 'badge-red',
        '불합격': 'badge-red' 
        // --- ⬆️ (수정) ⬆️ ---
    };
    return <span className={`px-2 py-1 text-xs font-semibold rounded-full ${colors[status] || 'badge-gray'}`}>{status || '미지정'}</span>;
};

// 4. 전역 스타일
const GlobalStyles = () => (
    <style>{`
        .input-style { display: block; width: 100%; padding: 0.5rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.375rem; box-shadow: inset 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .input-style:focus { outline: 2px solid transparent; outline-offset: 2px; border-color: #3b82f6; box-shadow: 0 0 0 2px #bfdbfe; }
        .label-style { display: block; margin-bottom: 0.25rem; font-size: 0.875rem; font-weight: 500; color: #374151; }
        .btn-primary { background-color: #2563eb; color: white; padding: 0.6rem 1.2rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.2s; box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px 0 rgba(0,0,0,.06); }
        .btn-primary:hover { background-color: #1d4ed8; } .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background-color: #d1d5db; color: #374151; padding: 0.6rem 1.2rem; border-radius: 0.375rem; font-weight: 600; transition: background-color 0.2s; box-shadow: 0 1px 3px 0 rgba(0,0,0,.1), 0 1px 2px 0 rgba(0,0,0,.06); }
        .btn-secondary:hover { background-color: #9ca3af; }
        .th-style { padding: 0.75rem 1rem; text-align: left; font-size: 0.75rem; font-weight: 500; color: #6b7280; text-transform: uppercase; white-space: nowrap;}
        .td-style { padding: 0.75rem 1rem; font-size: 0.875rem; }
        .badge-blue { background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; }
        .badge-green { background-color: #d1fae5; color: #065f46; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; }
        .badge-yellow { background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; }
        .badge-red { background-color: #fee2e2; color: #991b1b; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; }
        .badge-gray { background-color: #f3f4f6; color: #374151; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 600; border-radius: 9999px; }
        .badge-sm { padding: 0.25rem 0.75rem; font-size: 0.875rem; font-weight: 600; border-radius: 9999px; }
        .btn-tab { padding: 0.75rem 1.5rem; border-radius: 0.375rem; transition: background-color 0.2s, color 0.2s; }
        .btn-tab-active { background-color: #2563eb; color: white; }
        .stat-item { display: flex; justify-content: space-between; align-items: center; padding-bottom: 0.5rem; border-bottom: 1px solid #e5e7eb; font-size: 0.875rem;}
        .stat-label { color: #6b7280; } .stat-value { font-weight: 600; }
        .rate-value { font-size: 1.25rem; font-weight: 700; }
        .goal-value { font-size: 1.25rem; font-weight: 700; }
        .btn-period { padding: 0.5rem 1rem; border-radius: 0.375rem; transition: background-color 0.2s, color 0.2s; background-color: #f3f4f6; color: #374151; font-size: 0.875rem;}
        .btn-period:hover { background-color: #e5e7eb; }
        .btn-period-active { background-color: #2563eb; color: white; }
        .kpi-box { background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center; }
        .kpi-label { font-size: 0.875rem; color: #6b7280; }
        .kpi-value { font-size: 1.875rem; font-weight: 700; color: #1f2937; }
    `}</style>
);
