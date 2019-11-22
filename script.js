//=============== Source data
const cencusData = {
    "Alabama": 4802982,
    "Alaska": 721523,
    "Arizona": 6412700,
    "Arkansas": 2926229,
    "California": 37341989,
    "Colorado": 5044930,
    "Connecticut": 3581628,
    "Delaware": 900877,
    "Florida": 18900773,
    "Georgia": 9727566,
    "Hawaii": 1366862,
    "Idaho": 1573499,
    "Illinois": 12864380,
    "Indiana": 6501582,
    "Iowa": 3053787,
    "Kansas": 2863813,
    "Kentucky": 4350606,
    "Louisiana": 4553962,
    "Maine": 1333074,
    "Maryland": 5789929,
    "Massachusetts": 6559644,
    "Michigan": 9911626,
    "Minnesota": 5314879,
    "Mississippi": 2978240,
    "Missouri": 6011478,
    "Montana": 994416,
    "Nebraska": 1831825,
    "Nevada": 2709432,
    "New Hampshire": 1321445,
    "New Jersey": 8807501,
    "New Mexico": 2067273,
    "New York": 19421055,
    "North Carolina": 9565781,
    "North Dakota": 675905,
    "Ohio": 11568495,
    "Oklahoma": 3764882,
    "Oregon": 3848606,
    "Pennsylvania": 12734905,
    "Rhode Island": 1055247,
    "South Carolina": 4645975,
    "South Dakota": 819761,
    "Tennessee": 6375431,
    "Texas": 25268418,
    "Utah": 2770765,
    "Vermont": 630337,
    "Virginia": 8037736,
    "Washington": 6753369,
    "West Virginia": 1859815,
    "Wisconsin": 5698230,
    "Wyoming": 568300
};


//=============== Application
const RESERVED_SEATS = 50;
const DEFAULT_SEATS = 435;
const DEFAULT_SIM_TIME = 200;

let _total_seats = DEFAULT_SEATS;
let _simul_time = DEFAULT_SIM_TIME;
let _aborted = true;
let _defaultQueue;
let _queue;
let _progress;
let _table;
let _chart;
let _seatsInput;
let _simTimeInput;

function init() {
    _defaultQueue = [];
    for (const stateName of Object.keys(cencusData)) {
        _defaultQueue.push(
            calculatePriority({
                name: stateName,
                population: cencusData[stateName],
                seats: 1,
            }));
    }

    _defaultQueue.sort((a, b) => b.priority - a.priority);
    _table = document.getElementById("table");
    _chart = initChart(_defaultQueue.map((i) => i.name));

    _progress = $('#progress');
    _seatsInput = $('#seats_input');
    _simTimeInput = $('#sim_time_input');

    reset();
}

function reset() {
    _aborted = true;
    _queue = _defaultQueue.map(item => { return {...item}; });

    _progress.attr('value', 0);
    _progress.attr('max', _total_seats - RESERVED_SEATS);
}

function abortAndReset() {
    _aborted = true;

    // Wait a moment to let the sim step complete.
    setTimeout(() => {
        reset();
        print(0);
    }, _simul_time * 2);
}

function run() {
    if (_aborted) {
        reset();

        _total_seats = parseInt(_seatsInput.val()) || DEFAULT_SEATS;
        _simul_time = parseInt(_simTimeInput.val()) || DEFAULT_SIM_TIME;
        _progress.attr('max', _total_seats - RESERVED_SEATS);

        _aborted = false;
        simStep(0);
    }
}

// Recursive
function simStep(seat) {
    const nextSeat = seat +1;
    if (_aborted) {
        return;
    }

    if (seat < (_total_seats - RESERVED_SEATS)) {

        setTimeout(() => {
            const state = _queue[0];
            state.seats++;
            calculatePriority(state);

            _queue.sort((a, b) => b.priority - a.priority);

            print(nextSeat);
            simStep(nextSeat);

        }, _simul_time);

    } else {

        setTimeout(() => {
            _queue.sort((a, b) => b.seats - a.seats);
            print(nextSeat);

        }, _simul_time);
    }
}

function calculatePriority(state) {
    state.priority = Math.round(state.population / Math.sqrt(state.seats * (state.seats +1)));
    return state;
}



//=============== Presentation
function print(progress = 0) {
    _progress.attr('value', progress);
    let html = "";
    for (let i = 0; i < _queue.length; ++i) {
        html += `<tr>
                  <th scope="row">${i+1}</th>
                  <td>${_queue[i].name}</td>
                  <td>${_queue[i].seats}</td>
                  <td>${_queue[i].seats + 2}</td>
                 </tr>\n`;
    }

    _table.innerHTML = html;
    if (_chart) {
        printChart();
    }
}






//=============== Chart API
let btnEnable;
let btnDisable;

function initChart(labels) {
    btnEnable = $("#enableLock");
    btnDisable = $("#disableLock");

    return new Chart(document.getElementById('chart').getContext('2d'), {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                backgroundColor: "#007Bff",
                label: 'Cencus pop./seat',
            }, {
                backgroundColor: "#28a745",
                label: 'Cencus pop./vote',
            }]

        },
        options: {
            aspectRatio: 1.8,
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero: true
                    }
                }]
            }
        }
    });
}

function printChart() {
    const popSeat = {};
    const popVote = {};
    for (const item of _queue) {
        popSeat[item.name] = Math.round(item.population / item.seats);
        popVote[item.name] = Math.round(item.population / (item.seats + 2));
    }

    const dataSeats = [];
    const dataVotes = [];
    for (const state of _chart.data.labels) {
        dataSeats.push(popSeat[state]);
        dataVotes.push(popVote[state]);
    }

    _chart.data.datasets[0].data = dataSeats;
    _chart.data.datasets[1].data = dataVotes;
    _chart.update();
}

function enableLock() {
    btnEnable.hide();
    btnDisable.show();

    _chart.options.scales.yAxes[0].ticks.min = 0;
    _chart.options.scales.yAxes[0].ticks.max = 40000000;
    _chart.update();
}

function disableLock() {
    btnEnable.show();
    btnDisable.hide();

    delete _chart.options.scales.yAxes[0].ticks.min;
    delete _chart.options.scales.yAxes[0].ticks.max;
    _chart.update();
}

