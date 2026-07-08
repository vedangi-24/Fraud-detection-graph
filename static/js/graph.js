const graphElement = document.getElementById('graph');
const layoutSelect = document.getElementById('layoutSelect');
const refreshButton = document.getElementById('refresh') || document.getElementById('refreshGraph');

async function refreshGraph() {
    try {
        if (!graphElement) return;
        graphElement.style.transition = 'opacity 0.4s ease';
        graphElement.style.opacity = 0.4;

        const layoutType = layoutSelect ? layoutSelect.value : 'spring';
        const response = await fetch(`/dynamic?layout=${encodeURIComponent(layoutType)}`);
        if (!response.ok) {
            throw new Error(`Failed to load graph data (${response.status})`);
        }

        const graphData = await response.json();
        const layout = getGraphLayout();

        await Plotly.newPlot('graph', [graphData.edge_trace_normal, graphData.edge_trace_fraud, graphData.node_trace], layout, {
            displayModeBar: false,
            responsive: true
        });

        graphElement.style.opacity = 1;
        setupClickEvent();
    } catch (error) {
        console.error('Error refreshing graph:', error);
    }
}

if (refreshButton) {
    refreshButton.addEventListener('click', refreshGraph);
}

const downloadImageButton = document.getElementById('downloadImage');
const downloadPdfButton = document.getElementById('downloadPdf');

if (downloadImageButton) {
    downloadImageButton.addEventListener('click', function() {
        Plotly.downloadImage(document.getElementById('graph'), {format: 'png', filename: 'fraud-network'});
    });
}

if (downloadPdfButton) {
    downloadPdfButton.addEventListener('click', function() {
        Plotly.downloadImage(document.getElementById('graph'), {format: 'pdf', filename: 'fraud-network'});
    });
}

function getGraphLayout() {
    return {
        title: {
            text: 'Graph-Based Fraud Detection Network',
            font: { color: '#e5e7eb', size: 18 }
        },
        paper_bgcolor: 'rgba(15, 23, 42, 0.95)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.95)',
        font: { color: '#e5e7eb' },
        showlegend: false,
        hovermode: 'closest',
        margin: { t: 60, l: 20, r: 20, b: 20 },
        xaxis: {showgrid: false, zeroline: false, showticklabels: false},
        yaxis: {showgrid: false, zeroline: false, showticklabels: false}
    };
}

if (graphElement) {
    refreshGraph();
}

if (layoutSelect) {
    layoutSelect.addEventListener('change', refreshGraph);
}

// Setup click event for node details
function setupClickEvent() {
    if (!graphElement) return;

    graphElement.on('plotly_click', function(data) {
        const pt = data.points[0];
        const trace = data.points[0].data;
        const pointNumber = pt.pointNumber;
        let nodeId = pointNumber;

        if (trace && trace.customdata && trace.customdata[pointNumber]) {
            nodeId = trace.customdata[pointNumber].node_id;
        }

        fetch(`/node/${nodeId}`)
            .then(response => response.json())
            .then(nodeData => showNodeDetails(nodeId, nodeData))
            .catch(error => console.error('Error:', error));
    });
}

const searchBtn = document.getElementById('searchBtn');
const accountSearch = document.getElementById('accountSearch');
if (searchBtn && accountSearch) {
    searchBtn.addEventListener('click', function() {
        const value = accountSearch.value.trim();
        if (!value) return;

        const graphData = graphElement.data && graphElement.data[2];
        if (!graphData || !graphData.customdata) return;

        const searchId = Number(value);
        const pointNumber = graphData.customdata.findIndex(item => item && item.node_id === searchId);

        if (pointNumber >= 0) {
            Plotly.Fx.hover('graph', [{curveNumber: 2, pointNumber}]);
        } else {
            alert('Account ID not found in graph.');
        }
    });

    accountSearch.addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();
            searchBtn.click();
        }
    });
}

const filterButtons = document.querySelectorAll('.filter-btn');
filterButtons.forEach(button => {
    button.addEventListener('click', function(event) {
        filterButtons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        const filterType = event.target.dataset.filter;
        applyFilter(filterType);
    });
});

function applyFilter(filterType) {
    const graph = document.getElementById('graph');
    if (!graph.data || graph.data.length < 3) return;

    const nodeTrace = graph.data[2];
    const nodeMask = [];
    const custom = nodeTrace.customdata || [];
    custom.forEach((item, index) => {
        if (!item) {
            nodeMask.push(false);
            return;
        }
        if (filterType === 'all') nodeMask.push(true);
        else if (filterType === 'fraud') nodeMask.push(item.fraud === 1);
        else if (filterType === 'normal') nodeMask.push(item.fraud === 0);
        else if (filterType === 'high') nodeMask.push(item.risk_category === 'High' || item.risk_category === 'Critical');
        else nodeMask.push(true);
    });

    Plotly.restyle('graph', {
        'marker.opacity': [graph.data[2].marker.opacity.map((v, i) => nodeMask[i] ? 1 : 0.05)]
    }, [2]);
}

function showNodeDetails(nodeId, data) {
    const modal = document.getElementById('nodeModal');
    document.getElementById('nodeTitle').textContent = `Account ID ${nodeId}`;
    document.getElementById('nodeSummary').innerHTML = `Transactions: ${data.total_txns} &#8226; Connected Accounts: ${data.degree} &#8226; Fraud Probability: ${data.fraud_probability.toFixed(1)}% &#8226; Average Amount: ₹${data.avg_tx_amount.toFixed(2)}`;
    
    const tbody = document.querySelector('#txnTable tbody');
    tbody.innerHTML = '';
    data.txns.forEach(txn => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = txn.id;
        row.insertCell(1).textContent = txn.type;
        row.insertCell(2).textContent = txn.to !== undefined ? txn.to : txn.from !== undefined ? txn.from : 'N/A';
        row.insertCell(3).textContent = `₹${txn.amount.toFixed(2)}`;
        const fraudCell = row.insertCell(4);
        fraudCell.textContent = txn.fraud ? 'YES' : 'NO';
        fraudCell.style.color = txn.fraud ? '#fb7185' : '#86efac';
        if (txn.fraud) {
            fraudCell.classList.add('fraud-cell');
        }
    });
    
    document.getElementById('neighborsList').innerHTML = `Neighbors: ${data.neighbors.join(', ')}`;
    
    modal.style.display = 'block';
}

// Modal functionality
const modal = document.getElementById('nodeModal');
const closeBtn = document.querySelector('.close');
if (closeBtn) {
    closeBtn.onclick = function() {
        if (modal) {
            modal.style.display = 'none';
        }
    };
}
window.onclick = function(event) {
    if (modal && event.target == modal) {
        modal.style.display = 'none';
    }
}

if (graphElement) {
    setupClickEvent();
}
