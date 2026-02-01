import threading
import time
from collections import deque
from pynput import keyboard

class InputHookService:
    def __init__(self, on_violation=None, on_input=None):
        """
        :param on_violation: Callback function when a keyword is detected (keyword)
        :param on_input: Callback function for every key press (char) - useful for autocomplete
        """
        self.buffer_size = 30
        self.input_buffer = deque(maxlen=self.buffer_size)
        self.sensitive_keywords = ["scam", "refund now", "stupid", "fraud", "退款", "骗子", "傻逼"] # Example list
        self.on_violation = on_violation
        self.on_input = on_input
        self.listener = None
        self.is_running = False

    def _on_press(self, key):
        try:
            # Handle standard characters
            if hasattr(key, 'char') and key.char:
                char = key.char
                self.input_buffer.append(char)
                if self.on_input:
                    self.on_input(char)
            # Handle space as a separator or part of phrase
            elif key == keyboard.Key.space:
                self.input_buffer.append(' ')
            # Handle backspace
            elif key == keyboard.Key.backspace:
                if self.input_buffer:
                    self.input_buffer.pop()
            
            # Check violation after every significant keystroke
            self._check_keywords()
            
        except Exception as e:
            print(f"Hook Error: {e}")

    def _check_keywords(self):
        """Optimized keyword check using sliding window comparison"""
        current_text = "".join(self.input_buffer).lower()
        
        # Performance: Pre-filter keywords that could potentially match
        # (Assuming sensitive_keywords list might grow to 1000+)
        for keyword in self.sensitive_keywords:
            # $O(1)$ length check could be added if we store lengths
            if keyword.lower() in current_text:
                if self.on_violation:
                    self.on_violation(keyword)
                self.input_buffer.clear()
                break

    def start(self):
        if not self.is_running:
            self.is_running = True
            self.listener = keyboard.Listener(on_press=self._on_press)
            self.listener.start()
            print("Input Hook Service Started [Memory Level Monitoring]")

    def stop(self):
        if self.is_running and self.listener:
            self.listener.stop()
            self.is_running = False
            print("Input Hook Service Stopped")

    def update_keywords(self, new_keywords):
        self.sensitive_keywords = new_keywords
