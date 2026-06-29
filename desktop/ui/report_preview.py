import os
from PyQt6.QtWidgets import QDialog, QVBoxLayout, QHBoxLayout, QPushButton, QMessageBox, QTextBrowser
from PyQt6.QtCore import Qt, QEvent
from PyQt6.QtGui import QShortcut, QKeySequence
from PyQt6.QtPrintSupport import QPrinter, QPrintDialog

class PreviewDialog(QDialog):
    def __init__(self, html_content, title, default_filename="export.pdf", parent=None):
        super().__init__(parent)
        self.html_content = html_content
        self.default_filename = default_filename
        
        self.setWindowTitle(title)
        self.setFixedSize(800, 850)
        
        # Ensure we have a clean white background for the previewer
        self.setStyleSheet("background:#1a1a1a; color:#ffffff;")
        
        self.setup_ui()
        self.install_shortcuts_filter()
        self.register_shortcuts()

    def install_shortcuts_filter(self):
        self.installEventFilter(self)
        for w in self.findChildren(QDialog):
            w.installEventFilter(self)

    def eventFilter(self, obj, event):
        if event.type() == QEvent.Type.KeyPress:
            if self.handle_key_press(event):
                return True
        return super().eventFilter(obj, event)

    def keyPressEvent(self, event):
        if not self.handle_key_press(event):
            super().keyPressEvent(event)

    def register_shortcuts(self):
        def sc(key_str, fn):
            s = QShortcut(QKeySequence(key_str), self)
            s.setContext(Qt.ShortcutContext.WindowShortcut)
            s.activated.connect(fn)

        sc("Escape", self.close)
        sc("Ctrl+P", self.print_document)
        sc("Ctrl+S", self.export_pdf)
        # Scroll bindings can naturally be handled by QTextBrowser
        
    def handle_key_press(self, event):
        key = event.key()
        if key == Qt.Key.Key_Escape:
            self.close()
            return True
        return False

    def setup_ui(self):
        layout = QVBoxLayout(self)
        
        self.text_browser = QTextBrowser()
        self.text_browser.setHtml(self.html_content)
        # Use white background for the actual document preview to simulate paper
        self.text_browser.setStyleSheet("background-color: #ffffff; color: #000000;")
        layout.addWidget(self.text_browser)
        
        button_layout = QHBoxLayout()
        
        btn_style = (
            "QPushButton { background:#2a2a2a; color:#20b2aa; border:1px solid #20b2aa; "
            "font-family:'Courier New',monospace; font-size:14px; padding:6px 16px; font-weight:bold; } "
            "QPushButton:hover { background:#20b2aa; color:#111111; } "
            "QPushButton:focus { border: 2px solid #ffffff; }"
        )
        
        self.btn_print = QPushButton("Print")
        self.btn_print.setStyleSheet(btn_style)
        self.btn_print.clicked.connect(self.print_document)
        
        self.btn_export = QPushButton("Export PDF")
        self.btn_export.setStyleSheet(btn_style)
        self.btn_export.clicked.connect(self.export_pdf)
        
        self.btn_close = QPushButton("Close")
        self.btn_close.setStyleSheet(btn_style)
        self.btn_close.clicked.connect(self.close)
        
        button_layout.addStretch()
        button_layout.addWidget(self.btn_print)
        button_layout.addWidget(self.btn_export)
        button_layout.addWidget(self.btn_close)
        
        layout.addLayout(button_layout)

    def print_document(self):
        printer = QPrinter(QPrinter.PrinterMode.HighResolution)
        dialog = QPrintDialog(printer, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            self.text_browser.print(printer)
            QMessageBox.information(self, "Success", "Document sent to printer.")

    def export_pdf(self):
        from PyQt6.QtWidgets import QFileDialog
        desktop = os.path.expanduser("~/Desktop")
        file_path, _ = QFileDialog.getSaveFileName(self, "Save PDF", os.path.join(desktop, self.default_filename), "PDF Files (*.pdf)")
        
        if file_path:
            printer = QPrinter(QPrinter.PrinterMode.HighResolution)
            printer.setOutputFormat(QPrinter.OutputFormat.PdfFormat)
            printer.setOutputFileName(file_path)
            self.text_browser.print(printer)
            QMessageBox.information(self, "Exported", f"Document saved as PDF to:\n{file_path}")

def render_template(template_path, data):
    try:
        with open(template_path, 'r', encoding='utf-8') as file:
            template_str = file.read()
            # We use standard format. Make sure the HTML template uses {{ and }} for CSS braces to escape them.
            return template_str.format(**data)
    except Exception as e:
        return f"<h2>Error rendering template: {str(e)}</h2>"
