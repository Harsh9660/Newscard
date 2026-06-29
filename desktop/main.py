import customtkinter as ctk
from database import db
from navigation import AppWindowManager
from views import MainMenu
from network import sync_daemon

def check_subscription_status():
    # PART 4: Subscription-Locked Authentication Gate
    # Mocking cloud API call for subscription status
    # In reality, this would hit an API and check the local token.
    return True

def main():
    ctk.set_appearance_mode("dark")
    ctk.set_default_color_theme("blue")
    
    root = ctk.CTk()
    root.title("NEWSCARD ERP - Desktop Native")
    root.geometry("1024x768")
    
    # Check Auth Gate
    if not check_subscription_status():
        print("Subscription expired! Disable mutations.")
        # We would pass a flag down to disable edits
        
    nav_manager = AppWindowManager(root)
    nav_manager.navigate_to(MainMenu, breadcrumb="Main Menu")
    
    # Start the daemon sync worker (PART 4)
    sync_daemon.start()
    
    root.mainloop()
    
    # Cleanup on exit
    sync_daemon.stop()

if __name__ == "__main__":
    main()
