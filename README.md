



A sleek, fully local AI demo app running four NLP tasks in the browser — powered by a Python backend with HuggingFace models. No cloud. No API keys. Everything runs on your machine.

![AI Playground](https://img.shields.io/badge/status-active-brightgreen) ![Python](https://img.shields.io/badge/python-3.10%2B-blue) ![License](https://img.shields.io/badge/license-MIT-purple)

---

## Features

| Tab | Model | What it does |
|---|---|---|
| **Translation** | `facebook/nllb-200-distilled-600M` | Translate English into 14 languages |
| **Sentiment Analysis** | `distilbert-base-uncased-finetuned-sst-2-english` | Detect positive / negative tone with confidence score |
| **Semantic Search** | `all-MiniLM-L6-v2` | Find sentences by meaning using cosine similarity |
| **Summarization** | `sshleifer/distilbart-cnn-6-6` | Condense long text into a short summary |

---

## Preview

```
┌─────────────────────────────────────────────┐
│  ● AI Playground   Translation  Sentiment   │
│                    Semantic Search  Summary │
├─────────────────────────────────────────────┤
│                                             │
│   English          →         French         │
│   Hello, how                 Bonjour,       │
│   are you today?             comment        │
│                              allez-vous     │
│                              aujourd'hui ?  │
└─────────────────────────────────────────────┘
```

---

## Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/ai-playground-local.git
cd ai-playground-local
```

### 2. Install dependencies

```bash
pip install fastapi uvicorn transformers torch sentence-transformers tf-keras
```

### 3. (Optional) Set a custom model cache directory

By default models download to `./hf_cache`. To use a custom path set the environment variable before running:

```bash
# Windows
set HF_HOME=D:\my-models

# macOS / Linux
export HF_HOME=/data/my-models
```

### 4. Start the backend

```bash
python server.py
```

You should see:
```
INFO: Uvicorn running on http://0.0.0.0:8000
```

### 5. Open the app

Just open `index.html` in your browser. The status indicator in the top right will turn **green** when the server is connected.

> ⏳ The first time you use each feature, the model will download automatically. This only happens once — models are cached locally after that.

---

## Project Structure

```
ai-playground-local/
├── index.html       # Frontend UI
├── styles.css       # Dark theme styling
├── app.js           # Frontend logic & API calls
├── server.py        # FastAPI backend with all 4 endpoints
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Body | Returns |
|---|---|---|---|
| GET | `/health` | — | `{ status: "ok" }` |
| POST | `/translate` | `{ text, target_lang }` | `{ translation }` |
| POST | `/sentiment` | `{ text }` | `{ label, score }` |
| POST | `/search` | `{ query, corpus[] }` | `{ results[] }` |
| POST | `/summarize` | `{ text }` | `{ summary }` |

---

## Requirements

- Python 3.10+
- ~4GB disk space for all models
- No GPU required (CPU works fine, just slower)

---

## Model Sizes

| Model | Size |
|---|---|
| facebook/nllb-200-distilled-600M | ~2.5 GB |
| distilbert-base-uncased-finetuned-sst-2-english | ~250 MB |
| all-MiniLM-L6-v2 | ~90 MB |
| sshleifer/distilbart-cnn-6-6 | ~1.1 GB |

---

##  License
MIT — do whatever you want with it.
