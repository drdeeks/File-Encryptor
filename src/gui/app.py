from __future__ import annotations

try:
    import customtkinter as ctk
    USE_MODERN_UI = True
except ImportError:
    import tkinter as tk
    from tkinter import ttk
    USE_MODERN_UI = False

class FileEncryptorApp:
    """Main application window"""

    def __init__(self):
        if USE_MODERN_UI:
            ctk.set_appearance_mode("dark")
            self.root = ctk.CTk()
        else:
            self.root = tk.Tk()

        self.root.title("Ultimate Universal Encryptor")
        self.root.geometry("800x600")
        self.setup_ui()

    def setup_ui(self):
        """Setup user interface"""
        main_frame = ctk.CTkFrame(self.root, corner_radius=0) if USE_MODERN_UI else ttk.Frame(self.root, padding=20)
        main_frame.pack(fill="both", expand=True)

        title = ctk.CTkLabel(main_frame, text="🔐 Ultimate Universal Encryptor", font=("Arial", 24, "bold")) if USE_MODERN_UI else ttk.Label(main_frame, text="🔐 Ultimate Universal Encryptor", font=("Arial", 16))
        title.pack(pady=20)

        tabview = ctk.CTkTabview(main_frame) if USE_MODERN_UI else ttk.Notebook(main_frame)
        tabview.pack(fill="both", expand=True, padx=20, pady=10)

        if USE_MODERN_UI:
            tabview.add("📄 Encrypt File")
            tabview.add("📂 Decrypt File")

        # Import and create tabs
        from src.gui.tabs.file_encrypt import EncryptFileTab
        from src.gui.tabs.file_decrypt import DecryptFileTab

        encrypt_tab = EncryptFileTab(tabview.tab("📄 Encrypt File") if USE_MODERN_UI else tabview, self)
        decrypt_tab = DecryptFileTab(tabview.tab("📂 Decrypt File") if USE_MODERN_UI else tabview, self)

        if not USE_MODERN_UI:
            tabview.add(encrypt_tab, text="📄 Encrypt File")
            tabview.add(decrypt_tab, text="📂 Decrypt File")

        encrypt_tab.pack(fill="both", expand=True)
        decrypt_tab.pack(fill="both", expand=True)

    def run(self):
        """Run the application"""
        self.root.mainloop()
