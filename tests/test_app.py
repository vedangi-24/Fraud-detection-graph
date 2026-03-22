import pytest
from app import app
import pandas as pd

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_load_dataset():
    df = app.load_dataset()
    assert 'source' in df.columns
    assert 'target' in df.columns
    assert 'amount' in df.columns
    assert 'isFraud' in df.columns

def test_build_graph(client):
    response = client.get('/')
    assert response.status_code == 200

def test_node_details(client):
    response = client.get('/node/1')
    assert response.status_code == 200
    data = response.get_json()
    assert 'txns' in data
    assert 'neighbors' in data
