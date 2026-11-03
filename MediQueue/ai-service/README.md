# MediQueue AI service

A prototype Random Forest regression API for queue waiting-time estimates.

## Run
```bash
python -m venv venv
# Windows:
venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```
Service: http://127.0.0.1:5001

## Important limitation
The model is trained on generated synthetic demonstration data, not hospital records.
Treat its output as a software prototype only. For meaningful estimates, train and
validate it on anonymized historical arrival times and consultation durations.
