from transformers import TextIteratorStreamer

def get_streamer(tokenizer):
    return TextIteratorStreamer(tokenizer, skip_prompt=True, skip_special_tokens=True)
