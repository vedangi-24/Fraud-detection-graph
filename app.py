from flask import Flask, render_template, jsonify
import networkx as nx
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import plotly.graph_objects as go
import plotly.utils
import json
import random
import os

app = Flask(__name__)

def load_dataset():
    dataset_path = 'dataset.csv'
    if os.path.exists(dataset_path):
        df = pd.read_csv(dataset_path)
    else:
        df = generate_synthetic_data()
        df.to_csv(dataset_path, index=False)
    
    # Ensure numeric columns
    numeric_cols = ['source', 'target', 'amount', 'isFraud']
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
    
    return df

def generate_synthetic_data(n_users=100, n_transactions=500, fraud_rate=0.2):
    users = list(range(n_users))
    data = []
    fraud_users = random.sample(users, int(n_users * fraud_rate))
    
    txn_types = ['TRANSFER', 'PAYMENT', 'CASH_OUT', 'DEBIT']
    
    for i in range(n_transactions):
        u1 = random.choice(users)
        u2 = random.choice(users)
        amount = random.uniform(10, 5000)
        txn_type = random.choice(txn_types)
        
        is_fraud = 0
        if u1 in fraud_users or u2 in fraud_users or random.random() < 0.1:
            amount *= random.uniform(1.5, 8)
            is_fraud = 1
        
        data.append({
            'source': u1,
            'target': u2,
            'amount': amount,
            'isFraud': is_fraud,
            'type': txn_type
        })
    
    return pd.DataFrame(data)

def build_graph_and_features(df):
    G = nx.Graph()
    max_node = int(df[['source', 'target']].max().max())
    G.add_nodes_from(range(max_node + 1))
    
    for _, row in df.iterrows():
        source = int(row['source'])
        target = int(row['target'])
        G.add_edge(source, target, weight=float(row['amount']), fraud=int(row['isFraud']), type=row['type'])
    
    # Node txns
    for node in G.nodes:
        txns_out = [{'id': idx, 'type': data['type'], 'to': int(data['target']), 'amount': float(data['amount']), 'fraud': int(data['isFraud'])} 
                    for idx, data in df[df['source'] == node].iterrows()]
        txns_in = [{'id': idx, 'type': data['type'], 'from': int(data['source']), 'amount': float(data['amount']), 'fraud': int(data['isFraud'])} 
                   for idx, data in df[df['target'] == node].iterrows()]
        G.nodes[node]['txns'] = txns_out + txns_in
    
    # Features
    features = []
    for node in G.nodes:
        degree = G.degree(node)
        neighbors = list(G.neighbors(node))
        amounts = [G[node][n]['weight'] for n in neighbors]
        avg_amount = np.mean(amounts) if amounts else 0
        clustering = nx.clustering(G, node)
        fraud_neighbors = sum(G[node][n]['fraud'] for n in neighbors)
        features.append([degree, avg_amount, clustering, fraud_neighbors])
    
    return G, np.array(features, dtype=float)

def train_model(features):
    labels = np.random.binomial(1, 0.2, len(features))
    X_train, X_test, y_train, y_test = train_test_split(features, labels, test_size=0.2, random_state=42)
    
    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X_train, y_train)
    
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    
    return model, accuracy

def get_plotly_graph_data(G, predictions):
    edge_x, edge_y = [], []
    for edge in G.edges():
        x0, y0 = edge
        x1, y1 = edge[1], edge[0]
        edge_x += [x0, x1, None]
        edge_y += [y0, y1, None]
    
    edge_trace = go.Scatter(
        x=edge_x, y=edge_y,
        line=dict(width=0.5, color='#888'), hoverinfo='none', mode='lines'
    )
    
    node_x, node_y, node_text, node_color = [], [], [], []
    for node in G.nodes:
        x = random.uniform(0, 10)
        y = random.uniform(0, 10)
        node_x.append(x)
        node_y.append(y)
        txn_count = len(G.nodes[node]['txns'])
        node_text.append(f"Node {node}<br>Txns: {txn_count}<br>Fraud Prob: {predictions[node]:.1f}")
        node_color.append('red' if predictions[node] > 0.5 else 'blue')
    
    node_trace = go.Scatter(
        x=node_x, y=node_y,
        mode='markers',
        hovertext=node_text,
        marker=dict(size=12, color=node_color, line=dict(width=1))
    )
    
    return {'edge_trace': edge_trace, 'node_trace': node_trace}

@app.route('/')
def index():
    df = load_dataset()
    G, features = build_graph_and_features(df)
    model, accuracy = train_model(features)
    predictions = model.predict_proba(features)[:, 1]
    
    graph_data = get_plotly_graph_data(G, predictions)
    graph_json = json.dumps(graph_data, cls=plotly.utils.PlotlyJSONEncoder)
    
    fraud_count = np.sum(predictions > 0.5)
    
    return render_template('index.html', 
                          graph_json=graph_json,
                          accuracy=f'{accuracy:.3f}',
                          fraud_count=int(fraud_count),
                          normal_count=len(G.nodes) - int(fraud_count))

@app.route('/dynamic')
def dynamic():
    df = load_dataset()
    G, features = build_graph_and_features(df)
    model, _ = train_model(features)
    predictions = model.predict_proba(features)[:, 1]
    graph_data = get_plotly_graph_data(G, predictions)
    return jsonify(graph_data)

@app.route('/node/<int:node_id>')
def node_details(node_id):
    df = load_dataset()
    G, _ = build_graph_and_features(df)
    
    if node_id not in G.nodes:
        return jsonify({'error': 'Node not found'}), 404
    
    txns = G.nodes[node_id]['txns'][:15]
    neighbors = list(G.neighbors(node_id))
    
    fraud_tx = [t for t in txns if t['fraud'] == 1]
    
    return jsonify({
        'node_id': node_id,
        'total_txns': len(txns),
        'fraud_txns': len(fraud_tx),
        'degree': G.degree(node_id),
        'txns': txns,
        'neighbors': neighbors[:20],
        'avg_tx_amount': np.mean([t['amount'] for t in txns]) if txns else 0
    })

if __name__ == '__main__':
    app.run(debug=True)
