// 차트 컴포넌트
const ChartComponent = ({ type, data, options }) => {
    const { useRef, useEffect } = React;
    const canvasRef = useRef(null);
    const chartRef = useRef(null);

    useEffect(() => {
        if (canvasRef.current) {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
            const ctx = canvasRef.current.getContext('2d');
            chartRef.current = new Chart(ctx, {
                type: type,
                data: data,
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    ...options
                }
            });
        }
        return () => {
            if (chartRef.current) {
                chartRef.current.destroy();
            }
        };
    }, [type, data, options]);

    if (type === 'radar') {
        return (
            <div className="radar-chart-container">
                <canvas ref={canvasRef} />
            </div>
        );
    }
    return <canvas ref={canvasRef} />;
};
