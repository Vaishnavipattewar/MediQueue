from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.ensemble import RandomForestRegressor
import numpy as np

app = Flask(__name__)
CORS(app)

# Demonstration training data: replace with anonymized historical consultation
# durations from the hospital before using predictions for operational decisions.
rng = np.random.default_rng(42)
samples = 1200
people_ahead = rng.integers(0, 25, samples)
active_queue = rng.integers(0, 35, samples)
completed_today = rng.integers(0, 30, samples)
noise = rng.normal(0, 4, samples)
target = np.clip(people_ahead * 12 + active_queue * 0.8 - completed_today * 0.15 + noise, 0, 360)
X = np.column_stack([people_ahead, active_queue, completed_today])
model = RandomForestRegressor(n_estimators=120, random_state=42, min_samples_leaf=2)
model.fit(X, target)

@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'model': 'RandomForestRegressor', 'data': 'synthetic demonstration data'})

@app.post('/predict')
def predict():
    body = request.get_json(silent=True) or {}
    try:
        ahead = max(0, min(100, int(body.get('peopleAhead', 0))))
        active = max(0, min(150, int(body.get('activeQueue', ahead))))
        completed = max(0, min(150, int(body.get('completedToday', 0))))
    except (TypeError, ValueError):
        return jsonify({'error': 'peopleAhead, activeQueue and completedToday must be integers'}), 400
    estimate = int(round(float(model.predict([[ahead, active, completed]])[0])))
    return jsonify({
        'estimatedWaitMinutes': max(0, estimate),
        'model': 'Random Forest',
        'dataNote': 'Prototype estimate trained on synthetic demonstration data; not clinically validated.'
    })

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5001, debug=False)
