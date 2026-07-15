import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
import config

def load_model():
    print(f"Loading local model from {config.MODEL_PATH}...")
    tokenizer = AutoTokenizer.from_pretrained(config.MODEL_PATH)
    model = AutoModelForCausalLM.from_pretrained(
        config.MODEL_PATH,
        device_map="auto", 
        torch_dtype=torch.float16
    )
    return tokenizer, model
