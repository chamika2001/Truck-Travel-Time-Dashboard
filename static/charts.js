const ctx1 = document.getElementById('chart1').getContext('2d');
const ctx2 = document.getElementById('chart2').getContext('2d');
const ctx3 = document.getElementById('chart3').getContext('2d');

let chart1, chart2, chart3;
let chart1Type = 'line';
let chart2Type = 'line';
let chart3Type = 'line';

const COLOR_MAP = {
    'JCT': 'rgba(75, 192, 192, 1)',
    'ECT': 'rgba(255, 99, 132, 1)',
    'SAGT': 'rgba(255, 206, 86, 1)',
    'CICT': 'rgba(54, 162, 235, 1)',
    'CWIT': 'rgba(153, 102, 255, 1)'
};

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.slice(0, 7);

    document.getElementById('dateInput1').value = today;
    document.getElementById('monthInput2').value = currentMonth;
    document.getElementById('monthInput3').value = currentMonth;

    loadChart1Data(today);
    loadChart2Data(currentMonth);
    loadChart3Data(currentMonth);
});

function changeDate(offset) {
    const input = document.getElementById('dateInput1');
    let date = new Date(input.value || new Date());
    date.setDate(date.getDate() + offset);
    input.value = date.toISOString().split('T')[0];
    loadChart1Data(input.value);
}

function changeMonth(offset, chartNum) {
    const input = document.getElementById(`monthInput${chartNum}`);
    let [year, month] = input.value.split('-').map(Number);
    month += offset;
    if (month < 1) { month = 12; year -= 1; }
    if (month > 12) { month = 1; year += 1; }
    input.value = `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`;
    chartNum === 2 ? loadChart2Data(input.value) : loadChart3Data(input.value);
}

function setChartType(type, chartNum) {
    if (chartNum === 1) {
        chart1Type = type;
        loadChart1Data(document.getElementById('dateInput1').value);
    } else if (chartNum === 2) {
        chart2Type = type;
        loadChart2Data(document.getElementById('monthInput2').value);
    } else if (chartNum === 3) {
        chart3Type = type;
        loadChart3Data(document.getElementById('monthInput3').value);
    }
}

function buildChart(ctx, chartRef, chartType, data, labels, dateOrMonth, xTitle) {
    if (chartRef) chartRef.destroy();

    // ✅ Log chart data and labels to browser console
    console.log("JS Array (dataset):", data);
    console.log("Labels:", labels);

    const isStacked = chartType === 'stackedBar';

    const datasets = Object.keys(data).map(terminal => ({
        label: terminal,
        data: data[terminal].map(val => val <= 0 ? null : val),
        borderColor: COLOR_MAP[terminal],
        backgroundColor: COLOR_MAP[terminal].replace('1)', '0.6)'),
        pointRadius: ['line', 'scatter'].includes(chartType) ? 4 : 0,
        pointHoverRadius: ['line', 'scatter'].includes(chartType) ? 6 : 0,
        fill: chartType === 'line' ? false : undefined,
        tension: chartType === 'line' ? 0.4 : 0,  // Curve Add this line
        barPercentage: chartType === 'bar' ? 1.0 : 0.8,
        categoryPercentage: chartType === 'bar' ? 0.7 : 1.0,
        borderWidth: chartType === 'line' ? 2 : 1
    }));

    const chartData = chartType === 'scatter'
        ? { datasets: datasets.map(ds => ({ ...ds, data: ds.data.map((v, i) => v !== null ? { x: i, y: v } : null).filter(v => v) })) }
        : { labels, datasets };

    return new Chart(ctx, {
        type: isStacked ? 'bar' : chartType,
        data: chartData,
        options: {
            responsive: true,
            maintainAspectRatio: false,
            elements: {
                bar: {
                    borderRadius: 2,
                    barThickness: 'flex'
                }
            },
            scales: {
                x: {
                    stacked: isStacked,
                    type: chartType === 'scatter' ? 'linear' : 'category',
                    offset: chartType === 'bar' || chartType === 'stackedBar',
                    title: { display: true, text: xTitle, font: { size: 14 } },
                    ticks: {
                        font: { size: 12 },
                        stepSize: 1,
                        callback: function (value, index) {
                            if (chartType === 'scatter') {
                                return labels[value] !== undefined ? labels[value] : value;
                            }
                            return this.getLabelForValue ? this.getLabelForValue(value) : (labels[index] || value);
                        }
                    },
                    // Important: false for stackedBar, true otherwise
                },

                y: {
                    stacked: isStacked,
                    
                    ticks: {
                        font: { size: 12 },
                        
                    }
                }
            },
            plugins: {
                title: {
                    display: true,
                    text: `${chartType.charAt(0).toUpperCase() + chartType.slice(1).replace('stackedBar', 'Stacked Bar')} - ${dateOrMonth}`,
                    font: { size: 16 }
                },
                legend: { position: 'top', labels: { font: { size: 12 } } }
            }
        }
    });
}

async function loadChart1Data(date) {
    if (!date) return;
    try {
        const response = await axios.get(`/get_hourly_data?date=${date}`);
        const data = response.data;
        const labels = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0') + ':00');
        chart1 = buildChart(ctx1, chart1, chart1Type, data, labels, date, 'Hour of Day');
    } catch (error) {
        console.error('Error loading Chart 1:', error);
    }
}

async function loadChart2Data(month) {
    if (!month) return;
    const [year, monthNum] = month.split('-').map(Number);
    try {
        const response = await axios.get(`/get_daily_data?year=${year}&month=${monthNum}`);
        const data = response.data;
        const labels = data.days;
        chart2 = buildChart(ctx2, chart2, chart2Type, data.data, labels, month, 'Day of Month');
    } catch (error) {
        console.error('Error loading Chart 2:', error);
    }
}

async function loadChart3Data(month) {
    if (!month) return;
    const [year, monthNum] = month.split('-').map(Number);
    try {
        const response = await axios.get(`/get_weekday_data?year=${year}&month=${monthNum}`);
        const data = response.data;
        const labels = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        chart3 = buildChart(ctx3, chart3, chart3Type, data, labels, month, 'Day of Week');
    } catch (error) {
        console.error('Error loading Chart 3:', error);
    }
}

function toggleDarkMode() {
  const body = document.body;
  const btn = document.getElementById('darkModeBtn');
  const icon = btn.querySelector('i'); // find <i> inside button

  // Toggle dark mode class on body
  body.classList.toggle('dark');

  if (body.classList.contains('dark')) {
    // Dark mode ON → show sun icon
    icon.classList.remove('fa-moon');
    icon.classList.add('fa-sun');
    btn.setAttribute('aria-label', 'Switch to Light Mode');
  } else {
    // Light mode ON → show moon icon
    icon.classList.remove('fa-sun');
    icon.classList.add('fa-moon');
    btn.setAttribute('aria-label', 'Switch to Dark Mode');
  }
}
