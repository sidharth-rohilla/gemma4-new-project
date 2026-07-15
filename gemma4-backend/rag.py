from langchain_core.documents import Document
import numpy as np
from embeddings import embed_query, load_embedding_model
from vector_store import search_index, load_index
from preprocess import load_documents

class LegalRAGSystem:
    def __init__(self, doc_name: str):
        self.embedding_model = load_embedding_model()
        try:
            self.index = load_index(doc_name)
            self.documents = load_documents(f"{doc_name}.pkl")
            self.is_active = True
        except Exception:
            print(f"No active RAG database found for reference name: {doc_name}. Running in generation mode.")
            self.is_active = False

    def retrieve_context(self, query: str) -> list[Document]:
        if not self.is_active:
            return []
        eq = embed_query(query, self.embedding_model)
        _, indices = search_index(eq, self.index)
        return [self.documents[i] for i in indices[0] if i != -1]
