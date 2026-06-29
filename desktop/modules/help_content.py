MASTER_SHORTCUTS = {

  '── GLOBAL (every screen) ──': {
    'F1':              'Open help window',
    'F2':              'Open help (same as F1)',
    'F5':              'Refresh current view',
    'F9':              'Save / Options menu',
    'F10':             'Main application menu',
    'Escape':          'Close dialog / Cancel',
    'Enter':           'Confirm / Submit',
  },

  '── RECORD OPERATIONS ──': {
    'Ctrl+N':          'New record',
    'Ctrl+O':          'Open / Edit selected',
    'Ctrl+S':          'Save current form',
    'Ctrl+Shift+S':    'Save and add new',
    'Ctrl+R':          'Reset form to original',
    'Ctrl+Delete':     'Delete selected record',
    'Delete':          'Delete selected (lists)',
    'Ctrl+A':          'Select all rows',
    'Ctrl+F':          'Focus search bar',
  },

  '── DATA EXPORT ──': {
    'Ctrl+Shift+X':    'Export (PDF/CSV/Excel)',
    'Ctrl+Shift+P':    'Print current view',
    'Ctrl+Shift+C':    'Copy data to clipboard',
    # NOTE: Ctrl+E REMOVED — caused conflict
  },

  '── APP NAVIGATION ──': {
    'Ctrl+1':          'Dashboard',
    'Ctrl+2':          'Customers',
    'Ctrl+3':          'Rounds & Streets',
    'Ctrl+4':          'Publications',
    'Ctrl+5':          'Billing & Payments',
    'Ctrl+6':          'Suppliers',
    'Ctrl+7':          'Delivery',
    'Ctrl+8':          'Daily Order Sheet',
    'Ctrl+9':          'Analytics',
    'Ctrl+0':          'Settings',
    'Ctrl+W':          'Open Weekly Account',
    'Ctrl+K':          'Open Payment Calendar',
    'Ctrl+L':          'Logout',
  },

  '── WEEKLY ACCOUNT SCREEN ──': {
    'F1 / F2':         'Open help',
    'F3':              'Record payment (this week)',
    'F6':              'Paper & Adjustment screen',
    'F7':              'Amount Received dialog',
    'F8':              'Remove selected paper',
    'F9':              'Save all changes',
    'Ctrl+S':          'Save all changes',
    '0':               'Set quantity to 0 (..)',
    '1 - 9':           'Set quantity in active cell',
    'Tab':             'Move to next day cell',
    'Shift+Tab':       'Move to previous cell',
    'Up / Down':       'Move between paper rows',
    'Left / Right':    'Move between day columns',
    'Ctrl+Shift+P':    'Print weekly account',
    'Ctrl+Shift+C':    'Copy weekly data',
    'Escape':          'Close (save prompt if dirty)',
  },

  '── PAYMENT CALENDAR SCREEN ──': {
    'F1 / F2':         'Open help',
    'F3':              'Mark selected week paid',
    'F6':              'Open Paper & Adjustment',
    'F7':              'Amount Received dialog',
    'F9':              'Options menu',
    'Enter':           'Mark selected week paid',
    'Double-click':    'Mark selected week paid',
    'Arrow keys':      'Navigate calendar cells',
    'PageUp':          'Previous year',
    'PageDown':        'Next year',
    'Ctrl+Shift+P':    'Print calendar',
    'Ctrl+Shift+X':    'Export calendar PDF',
    'Escape':          'Close calendar',
  },

  '── PAPER & ADJUSTMENT SCREEN ──': {
    'F1 / F2':         'Open help',
    'F9':              'Save adjustments',
    'Tab':             'Move to next input field',
    'Shift+Tab':       'Move to previous field',
    'Escape':          'Close (confirm if values)',
  },

  '── AMOUNT RECEIVED DIALOG ──': {
    'F9':              'Confirm and save payment',
    'Enter':           'Confirm and save payment',
    'Tab':             'Next field',
    'Escape':          'Cancel — no changes made',
  },

  '── RECORD VOUCHERS DIALOG ──': {
    'F9':              'Save voucher',
    'Enter':           'Save voucher',
    'Tab':             'Next field',
    'Escape':          'Cancel — no changes made',
  },

  '── TABLE NAVIGATION ──': {
    'Up / Down':       'Navigate rows',
    'Enter':           'Open detail view',
    'Tab':             'Next field/column',
    'Shift+Tab':       'Previous field/column',
    'Ctrl+F':          'Focus search field',
  },
}

HELP_CONTENT = {
  'dashboard': {
    'title': 'Dashboard',
    'overview': 'Live overview of your entire newsagent business. 6 stat cards show key numbers...',
    'how_to': [('Refresh dashboard', 'Press F5 or click Refresh button.')],
    'shortcuts': [('F5', 'Refresh all data')],
    'faq': []
  }
}

def show_help(screen_name):
    pass
