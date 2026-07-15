import faiss
from sentence_transformers import SentenceTransformer
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import numpy as np
import pickle
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM, TextIteratorStreamer
from threading import Thread
import os

def read_all_pdf(documents: list[str]) -> list[Document]:
    all_doc = []
    for document in documents:
        loader = PyMuPDFLoader(document)
        doc = loader.load()
        all_doc.extend(doc)
    return all_doc

def chunking(documents: list[Document], chunk_size: int = 500, chunk_overlap: int = 100) -> list[Document]:
    splitter = RecursiveCharacterTextSplitter(chunk_size=chunk_size, chunk_overlap=chunk_overlap)
    chunks = splitter.split_documents(documents)
    return chunks

def load_embedding_model(model_name: str) -> SentenceTransformer:
    model = SentenceTransformer(model_name)
    return model

def embed_doc(documents: list[Document], model: SentenceTransformer) -> np.ndarray:
    text = [doc.page_content for doc in documents]
    embeddings = model.encode(text, show_progress_bar=True) 
    embeddings = np.asarray(embeddings, dtype=np.float32)
    faiss.normalize_L2(embeddings)
    return embeddings

def embed_query(query: str, embedding_model: SentenceTransformer) -> np.ndarray:
    embedded_query = embedding_model.encode([query])
    embedded_query = np.asarray(embedded_query, dtype=np.float32)
    faiss.normalize_L2(embedded_query)
    return embedded_query

def create_faiss_index(embedded_document: np.ndarray, use_gpu: bool = True) -> faiss.Index:
    dimension = len(embedded_document[0])
    index = faiss.IndexFlatIP(dimension)
    
    if use_gpu and torch.cuda.is_available():
        res = faiss.StandardGpuResources()
        index = faiss.index_cpu_to_gpu(res, 0, index)

    index.add(embedded_document)
    return index

def search_index(embedded_query: np.ndarray, index: faiss.Index, k: int = 5):
    distance, indices = index.search(embedded_query, k)
    return distance, indices

def save_index(index: faiss.Index, doc_name: str):
    if isinstance(index, faiss.GpuIndex):
        index = faiss.index_gpu_to_cpu(index)
    faiss.write_index(index, f'/kaggle/working/{doc_name}.faiss')
    print('Index saved successfully to /kaggle/working/')

def load_index(doc_name: str, use_gpu: bool = True) -> faiss.Index:
    index = faiss.read_index(f'/kaggle/working/{doc_name}.faiss')
    if use_gpu and torch.cuda.is_available():
        res = faiss.StandardGpuResources()
        index = faiss.index_cpu_to_gpu(res, 0, index)
    return index

def retrieve_documents(indices: np.ndarray, documents: list[Document]) -> list[Document]:
    return [documents[i] for i in indices[0]]

def save_documents(documents: list[Document], path: str):
    full_path = os.path.join('/kaggle/working/', path)
    with open(full_path, 'wb') as f:
        pickle.dump(documents, f)

def load_documents(path: str) -> list[Document]:
    full_path = os.path.join('/kaggle/working/', path)
    with open(full_path, 'rb') as f:
        return pickle.load(f)

SYSTEM_PROMPT = """
You are Nyayalaya, an AI Legal Assistant designed to help ordinary citizens understand legal information in simple, clear language.

Your purpose is to explain laws, legal rights, procedures, government services, and legal documents. You educate users but DO NOT replace a qualified lawyer.

Rules:
1. Never claim to be a lawyer.
2. Never provide definitive legal advice or guarantee legal outcomes.
3. Clearly mention when a question depends on jurisdiction or specific facts.
4. If the user's country or state is unknown, politely ask for it before answering.
5. Explain legal concepts in plain English without unnecessary legal jargon.
6. Break complex topics into simple steps.
7. When multiple options exist, explain each option with advantages and disadvantages.
8. If you are uncertain, say so instead of making up information.
9. Never fabricate laws, court cases, government schemes, or legal procedures.
10. When information may be outdated or depends on recent legal changes, recommend checking official government sources.

Primary jurisdiction: India.

Assume questions relate to Indian law unless the user specifies another country.

Always prioritize accuracy over completeness.

End every legal guidance response with:
"This information is for educational purposes and should not be considered legal advice. For advice specific to your situation, consult a qualified legal professional."
"""

def load_model(model_path: str):
    print(f"Loading local model from {model_path}...")
    tokenizer = AutoTokenizer.from_pretrained(model_path)
    model = AutoModelForCausalLM.from_pretrained(
        model_path,
        device_map="auto", 
        torch_dtype=torch.float16
    )
    return tokenizer, model

# --- Media Extraction Placeholders ---
def extract_text_from_audio(file_path: str) -> str:
    print(f"[Processing Audio: {file_path}]")
    return "This is placeholder text extracted from the audio file."

def extract_text_from_image(file_path: str) -> str:
    print(f"[Processing Image: {file_path}]")
    return "This is placeholder text extracted via OCR from the image."

def extract_text_from_video(file_path: str) -> str:
    print(f"[Processing Video: {file_path}]")
    return "This is placeholder text transcribed from the video."

def ask_model(tokenizer, model):
    
    languages = ["English", "Hindi", "Marathi", "Tamil", "Telugu"]
    print("\n--- Language Selection ---")
    for i, lang in enumerate(languages, 1):
        print(f"{i}. {lang}")
    
    try:
        lang_choice = int(input("Select your preferred language (1-5): ")) - 1
        selected_language = languages[lang_choice]
    except (ValueError, IndexError):
        print("Invalid input. Defaulting to English.")
        selected_language = "English"

    localized_system_prompt = SYSTEM_PROMPT + f"\n\nIMPORTANT: You must translate and provide all your responses entirely in {selected_language}."
    message = [{'role': 'system', 'content': localized_system_prompt}]
    
    device = next(model.parameters()).device 

    while True:
        print("\n--- Input Options ---")
        print("1. Text")
        print("2. Audio File")
        print("3. Image File")
        print("4. Video File")
        print("5. Exit")
        
        input_type = input("Choose input type (1-5): ")
        
        if input_type == '5' or input_type.lower() == 'exit':
            break
            
        user_text = ""
        
        if input_type == '1':
            user_text = input(f"User ({selected_language}): ")
        elif input_type == '2':
            path = input("Enter path to Audio file (e.g., /kaggle/input/dataset/audio.mp3): ")
            if os.path.exists(path):
                user_text = extract_text_from_audio(path)
            else:
                print("File not found.")
                continue
        elif input_type == '3':
            path = input("Enter path to Image file: ")
            if os.path.exists(path):
                user_text = extract_text_from_image(path)
            else:
                print("File not found.")
                continue
        elif input_type == '4':
            path = input("Enter path to Video file: ")
            if os.path.exists(path):
                user_text = extract_text_from_video(path)
            else:
                print("File not found.")
                continue
        else:
            print("Invalid option.")
            continue

        if not user_text.strip():
            continue

        message.append({'role': 'user', 'content': user_text})

        inputs = tokenizer.apply_chat_template(
            message, 
            tokenize=True, 
            add_generation_prompt=True,
            return_tensors='pt',
            return_dict=True 
        ).to(device)

        streamer = TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)

        thread = Thread(
            target=model.generate,
            kwargs={
                **inputs,
                'streamer': streamer,
                'max_new_tokens': 1024, 
                'do_sample': True,
                'temperature': 0.2
            }
        )

        thread.start()

        response = ''
        print(f'Assistant ({selected_language}): ', end='')
        for text in streamer:
            cleaned_text = text.replace("<|im_end|>", "").replace("<|eot_id|>", "")
            print(cleaned_text, end='', flush=True)
            response += cleaned_text
        print('\n')
        
        message.append({'role': 'assistant', 'content': response})


model_name = "/kaggle/input/gemma-2/transformers/gemma-2-9b-it/2" 

try:
    tokenizer, model = load_model(model_name)
    ask_model(tokenizer, model)
except OSError:
    print(f"Error: Model not found at {model_name}.")
    print("Please ensure you clicked '+ Add Input' -> 'Models' -> 'Gemma 2' -> 'Transformers' -> 'gemma-2-2b-it'.")
    print("If you attached version 1 instead of 2, change the path to end in '/1'.")