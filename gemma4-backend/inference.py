import os
from threading import Thread
import config
from model import load_model
from memory import ConversationMemory
from streaming import get_streamer
from rag import LegalRAGSystem
from prompt import format_context_prompt
import utils

def interact(tokenizer, model, rag_system: LegalRAGSystem):
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

    memory = ConversationMemory(selected_language)
    device = next(model.parameters()).device 

    while True:
        print("\n--- Input Options ---")
        print("1. Text\n2. Audio File\n3. Image File\n4. Video File\n5. Exit")
        
        input_type = input("Choose input type (1-5): ")
        if input_type == '5' or input_type.lower() == 'exit':
            break
            
        user_text = ""
        path = ""
        
        if input_type in ['2', '3', '4']:
            path = input("Enter asset file path: ")
            if not os.path.exists(path):
                print("File not found.")
                continue

        if input_type == '1':
            user_text = input(f"User ({selected_language}): ")
        elif input_type == '2':
            user_text = utils.extract_text_from_audio(path)
        elif input_type == '3':
            user_text = utils.extract_text_from_image(path)
        elif input_type == '4':
            user_text = utils.extract_text_from_video(path)
        else:
            print("Invalid option.")
            continue

        if not user_text.strip():
            continue

        context_chunks = rag_system.retrieve_context(user_text)
        enriched_query = format_context_prompt(user_text, context_chunks)
        memory.add_user_message(enriched_query)

        inputs = tokenizer.apply_chat_template(
            memory.get_history(), 
            tokenize=True, 
            add_generation_prompt=True,
            return_tensors='pt',
            return_dict=True 
        ).to(device)

        streamer = get_streamer(tokenizer)

        thread = Thread(
            target=model.generate,
            kwargs={
                **inputs,
                'streamer': streamer,
                'max_new_tokens': config.MAX_NEW_TOKENS, 
                'do_sample': config.DO_SAMPLE,
                'temperature': config.TEMPERATURE
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
        
        memory.add_assistant_message(response)

if __name__ == "__main__":
    rag_db = LegalRAGSystem(doc_name="indian_penal_code") 
    try:
        tokenizer, model = load_model()
        interact(tokenizer, model, rag_db)
    except OSError:
        print(f"Error: Model not found at path configurations.")
