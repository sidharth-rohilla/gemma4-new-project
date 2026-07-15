from prompt import get_localized_prompt

class ConversationMemory:
    def __init__(self, language: str):
        self.language = language
        self.history = [
            {'role': 'system', 'content': get_localized_prompt(language)}
        ]

    def add_user_message(self, content: str):
        self.history.append({'role': 'user', 'content': content})

    def add_assistant_message(self, content: str):
        self.history.append({'role': 'assistant', 'content': content})

    def get_history(self):
        return self.history
