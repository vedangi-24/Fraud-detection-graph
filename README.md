# Fraud Detection Using Graph AI 

[![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0-green.svg)](https://flask.palletsprojects.com/)
[![scikit-learn](https://img.shields.io/badge/scikit-learn-yellow.svg)](https://scikit-learn.org/)
[![NetworkX](https://img.shields.io/badge/NetworkX-orange.svg)](https://networkx.org/)
[![Plotly](https://img.shields.io/badge/Plotly-interactive-blueviolet.svg)](https://plotly.com/)

##  Overview
Flask web app for fraud detection using Graph Neural features + Random Forest.
- Transaction network graph (nodes=accounts, edges=txns)
- Interactive Plotly visualization (red=fraud, blue=normal)
- **Click nodes for detailed txn history & connections**
- 80/20 train/test split, model metrics
- PaySim-style fraud dataset

##  Quick Start
```bash
cd fraud-detection-graph-ai
pip install -r requirements.txt
python app.py
```
**Open:** http://127.0.0.1:5000/

## Features
| Feature | Description |
|---------|-------------|
| **Interactive Graph** | Plotly nodes/edges, hover=txn count, click=details modal |
| **ML Model** | Random Forest on graph features (degree, amount, clustering) |
| **Node Details** | Txn table (ID, type, partner, amount, fraud), neighbors list |
| **Dynamic** | Refresh for new predictions/dataset |
| **Dataset** | PaySim fraud CSV (source/target/amount/isFraud) |
| **Professional** | Model persistence, feature importance, tests, Docker |

##  Usage
1. **Graph loads** with accuracy/fraud counts
2. **Hover nodes** → txn count, fraud prob
3. **Click node** → Modal:
   ```
   Node 42: Degree 15, Fraud Tx 3/12
   Txns Table | ID | Type | Partner | Amount | Fraud
   | 127 | CASH_OUT | 58 | $8,234 | YES |
   Neighbors: [12, 35, 58, 92, ...]
   ```
4. **Refresh** → New analysis

##  Tech Stack
```
Backend: Flask + NetworkX + scikit-learn
Frontend: Plotly.js + vanilla JS + CSS
Data: dataset.csv (PaySim synthetic fraud)
ML: Random Forest (graph node features)
```

##  Testing
```bash
pip install pytest
pytest tests/ -v
```

##  Docker
```bash
docker build -t fraud-graph-ai .
docker run -p 5000:5000 fraud-graph-ai
```

##  Model Details
**Features:** degree, avg_tx_amount, clustering_coef, fraud_neighbors
**Train/Test:** 80/20 split
**Prediction:** Prob >0.5 = fraud (red node)

## 🔗 API Endpoints
| Endpoint | Description |
|----------|-------------|
| `/` | Main dashboard |
| `/dynamic` | Refresh graph data |
| `/node/{id}` | Node txn details JSON |
| `/feature-importance` | Model feature chart |

## File Structure
```
fraud-detection-graph-ai/
├── app.py              # Flask + ML + Graph
├── dataset.csv         # Fraud transactions
├── requirements.txt    # Dependencies
├── README.md          # 👈 This file
├── templates/
│   └── index.html     # Dashboard + modal
├── static/
│   ├── style.css      # Dark theme + modal
│   └── js/graph.js    # Plotly + click handlers
├── tests/             # Unit tests
└── Dockerfile         # Containerization
```

## Contributing
1. Fork repo
2. Create feature branch
3. PR with tests

## License
MIT License
