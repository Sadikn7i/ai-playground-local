"""
AI Playground — Python backend

Run:
    pip install fastapi uvicorn transformers torch sentence-transformers
Then:
    python server.py
"""
import os
# Set environment 
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import torch

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lazy model cache ─────────────────────────────────────────────────────────

_models = {}

def get_model(key):
    if key not in _models:
        print(f"Loading model: {key} ...")

        if key == "translate":
            from transformers import pipeline
            _models[key] = pipeline(
                "translation",
                model="facebook/nllb-200-distilled-600M",
                device=0 if torch.cuda.is_available() else -1,
            )

        elif key == "sentiment":
            from transformers import pipeline
            _models[key] = pipeline(
                "sentiment-analysis",
                model="distilbert-base-uncased-finetuned-sst-2-english",
                device=0 if torch.cuda.is_available() else -1,
            )

        elif key == "embed":
            from sentence_transformers import SentenceTransformer
            _models[key] = SentenceTransformer("all-MiniLM-L6-v2")

        elif key == "summarize":
            from transformers import pipeline
            _models[key] = pipeline(
                "summarization",
                model="sshleifer/distilbart-cnn-6-6",
                device=0 if torch.cuda.is_available() else -1,
            )

        print(f"Model ready: {key}")
    return _models[key]


# ── Health ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok"}


# ── Translation ──────────────────────────────────────────────────────────────

class TranslateRequest(BaseModel):
    text: str
    target_lang: str

@app.post("/translate")
def translate(req: TranslateRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is empty")
    try:
        pipe = get_model("translate")
        result = pipe(req.text, tgt_lang=req.target_lang, src_lang="eng_Latn")
        return {"translation": result[0]["translation_text"]}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Sentiment ────────────────────────────────────────────────────────────────

class TextRequest(BaseModel):
    text: str

@app.post("/sentiment")
def sentiment(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is empty")
    try:
        pipe = get_model("sentiment")
        result = pipe(req.text[:512])
        return {"label": result[0]["label"], "score": result[0]["score"]}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Semantic Search ──────────────────────────────────────────────────────────

class SearchRequest(BaseModel):
    query: str
    corpus: List[str]

@app.post("/search")
def search(req: SearchRequest):
    if not req.query.strip() or not req.corpus:
        raise HTTPException(400, "Query or corpus is empty")
    try:
        import numpy as np
        model = get_model("embed")
        q_emb = model.encode([req.query], normalize_embeddings=True)
        c_emb = model.encode(req.corpus, normalize_embeddings=True)
        scores = (q_emb @ c_emb.T)[0]
        ranked = sorted(
            [{"text": t, "score": float(s)} for t, s in zip(req.corpus, scores)],
            key=lambda x: x["score"],
            reverse=True,
        )
        return {"results": ranked}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Summarization ────────────────────────────────────────────────────────────

@app.post("/summarize")
def summarize(req: TextRequest):
    if not req.text.strip():
        raise HTTPException(400, "Text is empty")
    try:
        pipe = get_model("summarize")
        result = pipe(req.text[:1024], max_length=150, min_length=30, do_sample=False)
        return {"summary": result[0]["summary_text"]}
    except Exception as e:
        raise HTTPException(500, str(e))


# ── Run ──────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)