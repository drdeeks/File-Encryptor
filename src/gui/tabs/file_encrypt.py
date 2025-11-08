from __future__ import annotations

try:
    import customtkinter as ctk
    USE_MODERN_UI = True
except ImportError:
    import tkinter as tk
    from tkinter import ttk
    USE_MODERN_UI = False

from tkinter import filedialog, messagebox
from pathlib import Path
from typing import TYPE_CHECKING
import threading

from src.core.file_crypto import FileCrypto
from src.config.settings import EncryptionConfig

if TYPE_CHECKING:
    from src.gui.app import FileEncryptorApp

class EncryptFileTab(ctk.CTkFrame if USE_MODERN_UI else ttk.Frame):
    def __init__(self, master, app: FileEncryptorApp):
        super().__init__(master)
        self.app = app
        self.crypto = FileCrypto(EncryptionConfig())
        self.selected_file = None
        self.create_widgets()

    def create_widgets(self):
        # File selection
        file_frame = ctk.CTkFrame(self) if USE_MODERN_UI else ttk.LabelFrame(self, text="File Selection", padding=10)
        file_frame.pack(fill="x", padx=10, pady=5)

        self.file_label = ctk.CTkLabel(file_frame, text="No file selected") if USE_MODERN_UI else ttk.Label(file_frame, text="No file selected")
        self.file_label.pack(side="left", padx=10, pady=10)

        browse_button = ctk.CTkButton(file_frame, text="Browse", command=self.browse_file) if USE_MODERN_UI else ttk.Button(file_frame, text="Browse", command=self.browse_file)
        browse_button.pack(side="right", padx=10, pady=10)

        # Password
        password_frame = ctk.CTkFrame(self) if USE_MODERN_UI else ttk.LabelFrame(self, text="Password", padding=10)
        password_frame.pack(fill="x", padx=10, pady=5)

        self.password_entry = ctk.CTkEntry(password_frame, show="*") if USE_MODERN_UI else ttk.Entry(password_frame, show="*")
        self.password_entry.pack(fill="x", padx=10, pady=10)

        # Options
        options_frame = ctk.CTkFrame(self) if USE_MODERN_UI else ttk.LabelFrame(self, text="Options", padding=10)
        options_frame.pack(fill="x", padx=10, pady=5)

        self.delete_original_var = tk.BooleanVar()
        delete_check = ctk.CTkCheckBox(options_frame, text="Delete original after encryption", variable=self.delete_original_var) if USE_MODERN_UI else ttk.Checkbutton(options_frame, text="Delete original after encryption", variable=self.delete_original_var)
        delete_check.pack(anchor="w", padx=10, pady=10)

        # Encrypt button
        encrypt_button = ctk.CTkButton(self, text="Encrypt File", command=self.encrypt_file) if USE_MODERN_UI else ttk.Button(self, text="Encrypt File", command=self.encrypt_file)
        encrypt_button.pack(pady=20)

        # Progress
        self.progress = ctk.CTkProgressBar(self, mode='determinate') if USE_MODERN_UI else ttk.Progressbar(self, mode='determinate')
        self.progress.set(0) if USE_MODERN_UI else self.progress.config(value=0)
        self.progress.pack(fill='x', padx=10, pady=10)

    def browse_file(self):
        self.selected_file = filedialog.askopenfilename()
        if self.selected_file:
            self.file_label.configure(text=Path(self.selected_file).name)

    def encrypt_file(self):
        if not self.selected_file:
            messagebox.showerror("Error", "Please select a file first")
            return

        password = self.password_entry.get()
        if not password:
            messagebox.showerror("Error", "Please enter a password")
            return

        def progress_update(current, total):
            self.progress['value'] = (current / total) * 100
            self.app.root.update_idletasks()

        def do_encrypt():
            try:
                output = self.crypto.encrypt_file(
                    Path(self.selected_file),
                    password,
                    progress_callback=progress_update
                )
                if self.delete_original_var.get():
                    Path(self.selected_file).unlink()
                messagebox.showinfo("Success", f"File encrypted to {output}")
            except Exception as e:
                messagebox.showerror("Error", str(e))
            finally:
                self.progress['value'] = 0

        threading.Thread(target=do_encrypt, daemon=True).start()
