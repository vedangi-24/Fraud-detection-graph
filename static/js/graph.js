document.getElementById('refresh').addEventListener('click', async function() {
    try {
        const response = await fetch('/dynamic');
        const graphData = await response.json();
        
        const layout = {
            title: 'Dynamic Transaction Network - Updated Fraud Detection',
            showlegend: false,
            hovermode: 'closest',
            margin: { t: 40 },
            xaxis: {showgrid: false, zeroline: false, showticklabels: false},
            yaxis: {showgrid: false, zeroline: false, showticklabels: false}
        };
        Plotly.newPlot('graph', [graphData.node_trace, graphData.edge_trace], layout);
        // Re-attach click event
        setupClickEvent();
        
        // Update metrics (simulate)
        const accuracyP = document.querySelector('.metrics p:nth-child(1)');
        const fraudP = document.querySelector('.metrics p:nth-child(2)');
        const normalP = document.querySelector('.metrics p:nth-child(3)');
        const newAccuracy = (0.8 + Math.random() * 0.15).toFixed(2);
        const newFraud = Math.floor(Math.random()*50 + 20);
        accuracyP.textContent = `Model Accuracy: ${newAccuracy}`;
        fraudP.textContent = `Fraud Nodes: ${newFraud} (red)`;
        normalP.textContent = `Normal Nodes: ${180 - newFraud} (blue)`;
    } catch (error) {
        console.error('Error refreshing graph:', error);
    }
});

// Setup click event for node details
function setupClickEvent() {
    document.getElementById('graph').on('plotly_click', function(data){
        const pt = data.points[0];
        const nodeId = pt.pointNumber;  // Node index
        fetch(`/node/${nodeId}`)
            .then(response => response.json())
            .then(data => showNodeDetails(nodeId, data))
            .catch(error => console.error('Error:', error));
    });
}

function showNodeDetails(nodeId, data) {
    const modal = document.getElementById('nodeModal');
    document.getElementById('nodeTitle').textContent = `Node ${nodeId} Details`;
    document.getElementById('nodeSummary').textContent = `Degree: ${data.degree}, Avg Amount: $${data.avg_amount}, Fraud Txns: ${data.fraud_tx_count}/${data.total_txns}`;
    
    const tbody = document.querySelector('#txnTable tbody');
    tbody.innerHTML = '';
    data.txns.forEach(txn => {
        const row = tbody.insertRow();
        row.insertCell(0).textContent = txn.id;
        row.insertCell(1).textContent = txn.type;
        row.insertCell(2).textContent = txn.to || txn.from || 'N/A';
        row.insertCell(3).textContent = `$${txn.amount.toFixed(2)}`;
        const fraudCell = row.insertCell(4);
        fraudCell.textContent = txn.fraud ? 'YES' : 'NO';
        fraudCell.style.color = txn.fraud ? 'red' : 'green';
    });
    
    document.getElementById('neighborsList').innerHTML = `Neighbors: ${data.neighbors.join(', ')}`;
    
    modal.style.display = 'block';
}

// Modal functionality
const modal = document.getElementById('nodeModal');
const closeBtn = document.querySelector('.close');
closeBtn.onclick = function() {
    modal.style.display = 'none';
}
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

setupClickEvent();
