# 🏥 MediQueue – AI-Driven Hospital Patient Flow and Resource Optimization Platform

MediQueue is an AI-driven hospital appointment and patient flow management platform designed to simplify appointment scheduling, improve queue visibility, and make hospital operations more efficient.

The platform provides separate dashboards for patients, doctors, and administrators. It also incorporates a Machine Learning model to estimate patient waiting times based on queue-related information.

---

## 🚀 Key Features

### 👤 Patient Module

* Patient registration and login.
* Browse available doctors.
* Book online and in-person appointments.
* Receive appointment tokens.
* Track appointment and queue status.
* View AI-based estimated waiting time.
* Make online consultation payments through Razorpay.
* Join virtual consultations through Zoom.
* Access prescriptions.

### 👨‍⚕️ Doctor Module

* Doctor login and dashboard.
* View assigned appointments.
* Manage appointment status.
* Conduct online consultations.
* Add prescriptions for patients.

### 🛠️ Admin Module

* Manage doctor information.
* Monitor appointments.
* View hospital activity.

### 🤖 AI-Based Waiting Time Prediction

MediQueue incorporates a Random Forest Regression model to estimate patient waiting time.

The model considers three input features:

* Number of people ahead in the queue.
* Number of patients in the active queue.
* Number of consultations completed today.

The AI service is developed using Python, Flask, NumPy, and Scikit-learn.

**Note:** The current prototype uses 1,200 synthetically generated demonstration records. Predictions are not clinically validated. Real-world deployment would require anonymized historical hospital data and proper model evaluation.

### 💳 Online Payment Integration

* Razorpay integration for online consultation payments.
* Test-mode payment processing.

### 📹 Telemedicine Integration

* Zoom meeting links for online consultations.
* Shared meeting access for patients and doctors.

---

## 🧰 Technology Stack

| Layer                 | Technologies            |
| --------------------- | ----------------------- |
| Frontend              | React.js, Vite          |
| Backend               | Node.js, Express.js     |
| Database              | MongoDB                 |
| Programming Languages | JavaScript, Python      |
| AI/ML Framework       | Flask, Scikit-learn     |
| Numerical Computing   | NumPy                   |
| ML Algorithm          | Random Forest Regressor |
| Payment Gateway       | Razorpay                |
| Video Conferencing    | Zoom                    |

---

## 🏗️ System Architecture

```text
                 MediQueue
                     |
             React + Vite
                Frontend
                     |
               REST APIs
                     |
           Node.js + Express
               Backend
                     |
              MongoDB
               Database
                     |
          Python Flask Service
                     |
          Random Forest Model
                     |
          Waiting Time Prediction
```

The React frontend communicates with the Node.js and Express backend through APIs. The backend interacts with MongoDB to manage application data and communicates with the separate Python Flask service for AI-based waiting-time predictions.

---

## 📂 Project Structure

```text
MediQueue/
│
├── client/                  # React + Vite frontend
│   ├── src/
│   ├── public/
│   └── package.json
│
├── server/                  # Node.js + Express backend
│   ├── src/
│   └── package.json
│
├── ai-service/              # Python AI service
│   ├── app.py
│   └── requirements.txt
│
├── .gitignore
└── README.md
```

*The structure above is representative; adjust it if your actual folders differ.*

---

## ⚙️ Installation and Setup

### Prerequisites

Make sure you have installed:

* Node.js and npm
* Python 3
* MongoDB
* Git

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/MediQueue.git
cd MediQueue
```

### 2. Setup the Backend

```bash
cd server
npm install
```

Configure your backend environment variables in a `.env` file according to your application's configuration.

Start the backend:

```bash
npm run dev
```

The backend runs on:

`http://localhost:5000`

### 3. Setup the Frontend

Open another terminal:

```bash
cd client
npm install
npm run dev
```

The Vite development server runs at:

`http://localhost:3000`

### 4. Setup the AI Service

Open another terminal:

```bash
cd ai-service
```

Create and activate a Python virtual environment:

```bash
python -m venv venv
```

Windows:

```powershell
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start the Flask service:

```bash
python app.py
```

The AI service runs at:

`http://127.0.0.1:5001`

### 5. Verify the AI Service

Check the health endpoint:

```http
GET http://127.0.0.1:5001/health
```

For waiting-time prediction:

```http
POST http://127.0.0.1:5001/predict
```

Example request:

```json
{
  "peopleAhead": 10,
  "activeQueue": 15,
  "completedToday": 8
}
```

Example response format:

```json
{
  "estimatedWaitMinutes": 42,
  "model": "Random Forest",
  "dataNote": "Prototype estimate trained on synthetic demonstration data; not clinically validated."
}
```

*The response value above is illustrative.*

---

## 🧠 Machine Learning Approach

**Algorithm:** Random Forest Regression

**Training Data:** 1,200 synthetically generated demonstration records.

**Input Features:**

1. People ahead in queue.
2. Active queue size.
3. Completed consultations today.

**Target Variable:** Estimated waiting time in minutes.

The model uses 120 decision trees to generate waiting-time estimates. The predictions from the trees are combined to produce the final regression output.

The model is trained when the Flask application starts.

---

## 🔮 Future Enhancements

* Train and validate the prediction model using anonymized historical hospital data.
* Improve prediction accuracy through additional queue and consultation-related features.
* Real-time notifications for patients and doctors.
* Dynamic Zoom meeting creation and management.
* Multi-hospital support.
* Advanced hospital analytics and reporting.
* Mobile application support.

---

## 🎯 Project Objective

The main objective of MediQueue is to bring appointment management, queue tracking, AI-based waiting-time estimation, online payments, and virtual consultations together in one platform.

It aims to improve patient experience and provide better visibility into hospital appointment workflows.

---

## 👩‍💻 Project Information

**Project Name:** MediQueue
**Category:** Full-Stack Development | Artificial Intelligence | Healthcare Technology
**Architecture:** MERN-based application with a separate Python AI service
