"""
Lightweight, dependency-free vector store for Vayu Intelligence RAG.

Design goals
------------
- Works out of the box using only NumPy (already a project dependency) via a
  TF-IDF + cosine-similarity retriever. No FAISS / torch / network required.
- Transparently upgrades to dense sentence-transformer embeddings IF the
  library is installed, giving better semantic recall for the demo.
- Returns retrieved passages WITH source citations so advisories can say
  "according to CPCB GRAP Stage III..." — grounding, not hallucination.
"""

from __future__ import annotations

import math
import re
from typing import List, Dict, Tuple, Optional

import numpy as np

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> List[str]:
    return _TOKEN_RE.findall(text.lower())


class VectorStore:
    """A tiny retriever over a list of {text, source, tags} documents."""

    def __init__(self, use_embeddings: bool = True):
        self.documents: List[Dict] = []
        self._tfidf_matrix: Optional[np.ndarray] = None
        self._vocab: Dict[str, int] = {}
        self._idf: Optional[np.ndarray] = None
        self._embeddings: Optional[np.ndarray] = None
        self._embed_model = None

        if use_embeddings:
            try:  # optional, only if installed
                from sentence_transformers import SentenceTransformer

                self._embed_model = SentenceTransformer("all-MiniLM-L6-v2")
            except Exception:
                self._embed_model = None  # fall back to TF-IDF silently

    @property
    def mode(self) -> str:
        return "embeddings" if self._embed_model is not None else "tfidf"

    # --- indexing ---------------------------------------------------------
    def add_documents(self, documents: List[Dict]) -> None:
        """documents: list of {"text": str, "source": str, "tags": [str]}"""
        self.documents = documents
        if self._embed_model is not None:
            texts = [d["text"] for d in documents]
            self._embeddings = np.asarray(
                self._embed_model.encode(texts, normalize_embeddings=True)
            )
        else:
            self._build_tfidf([d["text"] for d in documents])

    def _build_tfidf(self, corpus: List[str]) -> None:
        tokenized = [_tokenize(t) for t in corpus]
        vocab: Dict[str, int] = {}
        for tokens in tokenized:
            for tok in tokens:
                if tok not in vocab:
                    vocab[tok] = len(vocab)
        self._vocab = vocab

        n_docs = len(corpus)
        df = np.zeros(len(vocab))
        tf = np.zeros((n_docs, len(vocab)))
        for i, tokens in enumerate(tokenized):
            seen = set()
            for tok in tokens:
                j = vocab[tok]
                tf[i, j] += 1.0
                if tok not in seen:
                    df[j] += 1.0
                    seen.add(tok)

        self._idf = np.log((1 + n_docs) / (1 + df)) + 1.0
        matrix = tf * self._idf
        norms = np.linalg.norm(matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        self._tfidf_matrix = matrix / norms

    def _vectorize_query(self, query: str) -> np.ndarray:
        vec = np.zeros(len(self._vocab))
        for tok in _tokenize(query):
            j = self._vocab.get(tok)
            if j is not None:
                vec[j] += 1.0
        vec = vec * self._idf
        norm = np.linalg.norm(vec)
        return vec / norm if norm else vec

    # --- retrieval --------------------------------------------------------
    def search(self, query: str, k: int = 3) -> List[Tuple[Dict, float]]:
        if not self.documents:
            return []

        if self._embed_model is not None and self._embeddings is not None:
            q = np.asarray(self._embed_model.encode([query], normalize_embeddings=True))[0]
            scores = self._embeddings @ q
        else:
            q = self._vectorize_query(query)
            scores = self._tfidf_matrix @ q

        top = np.argsort(scores)[::-1][:k]
        return [(self.documents[i], float(scores[i])) for i in top if scores[i] > 0]


# Module-level singleton built lazily on first import via ingest_docs.
_STORE: Optional[VectorStore] = None


def get_store() -> VectorStore:
    global _STORE
    if _STORE is None:
        from rag.ingest_docs import build_store

        _STORE = build_store()
    return _STORE
