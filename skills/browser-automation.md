# Skill: Browser & Computer Automation

## Trigger
"open", "go to", "navigate", "click", "fill out", "scrape", "screenshot", "run on my mac", "send iMessage", "text", "note", "check [website]", "log into", "post to", "automate [app]", any task requiring browser or desktop interaction

## Goal
Execute any task a human can do on a computer — browser navigation, form filling, web scraping, file management, Mac app control, iMessage communication, and Apple Notes — using available computer-use tools.

---

## Tool Inventory

### Browser (Claude in Chrome — Primary)
Use for rich browser interaction: clicking, form filling, JavaScript execution, screenshots.

| Tool | Use For |
|------|---------|
| `mcp__Claude_in_Chrome__navigate` | Go to any URL |
| `mcp__Claude_in_Chrome__read_page` | Read full page DOM + screenshot |
| `mcp__Claude_in_Chrome__get_page_text` | Extract visible text from current page |
| `mcp__Claude_in_Chrome__find` | Find element on page by text or selector |
| `mcp__Claude_in_Chrome__form_input` | Type into inputs, select dropdowns, check boxes |
| `mcp__Claude_in_Chrome__javascript_tool` | Execute any JS on the page |
| `mcp__Claude_in_Chrome__computer` | Click, scroll, type via pixel coordinates |
| `mcp__Claude_in_Chrome__tabs_create_mcp` | Open new tab |
| `mcp__Claude_in_Chrome__tabs_close_mcp` | Close a tab |
| `mcp__Claude_in_Chrome__tabs_context_mcp` | List all open tabs |
| `mcp__Claude_in_Chrome__shortcuts_execute` | Keyboard shortcuts (Cmd+C, etc.) |
| `mcp__Claude_in_Chrome__read_network_requests` | Intercept API calls made by a page |
| `mcp__Claude_in_Chrome__read_console_messages` | Read browser console for errors/data |
| `mcp__Claude_in_Chrome__upload_image` | Upload an image to a form |
| `mcp__Claude_in_Chrome__file_upload` | Upload a file via browser |
| `mcp__Claude_in_Chrome__resize_window` | Resize browser for mobile/desktop testing |
| `mcp__Claude_in_Chrome__gif_creator` | Record a GIF of browser actions |
| `mcp__Claude_in_Chrome__switch_browser` | Switch between Chrome/Safari/Firefox |

### Browser (Control Chrome — Lightweight)
Use when you just need to open a URL or get page content without full interaction.

| Tool | Use For |
|------|---------|
| `mcp__Control_Chrome__open_url` | Open URL (simpler than navigate) |
| `mcp__Control_Chrome__get_page_content` | Get page HTML |
| `mcp__Control_Chrome__execute_javascript` | Run JS without full page load |
| `mcp__Control_Chrome__list_tabs` | List all open tabs |
| `mcp__Control_Chrome__switch_to_tab` | Switch to a specific tab |
| `mcp__Control_Chrome__close_tab` | Close a tab by ID |
| `mcp__Control_Chrome__go_back` / `go_forward` | Browser navigation |
| `mcp__Control_Chrome__reload_tab` | Refresh current tab |
| `mcp__Control_Chrome__get_current_tab` | Get current tab info |

### Mac System (Desktop Commander)
Use for file system operations, running processes, and deep system tasks.

| Tool | Use For |
|------|---------|
| `mcp__Desktop_Commander__list_directory` | List files in a directory |
| `mcp__Desktop_Commander__read_file` | Read any file on Mac |
| `mcp__Desktop_Commander__write_file` | Write/create any file on Mac |
| `mcp__Desktop_Commander__edit_block` | Edit a specific block in a file |
| `mcp__Desktop_Commander__move_file` | Move or rename files |
| `mcp__Desktop_Commander__create_directory` | Create folders |
| `mcp__Desktop_Commander__get_file_info` | File metadata (size, modified, etc.) |
| `mcp__Desktop_Commander__start_process` | Launch any Mac application or script |
| `mcp__Desktop_Commander__kill_process` | Kill a running process |
| `mcp__Desktop_Commander__list_processes` | See all running processes |
| `mcp__Desktop_Commander__read_process_output` | Read stdout from a running process |
| `mcp__Desktop_Commander__interact_with_process` | Send input to a running process |
| `mcp__Desktop_Commander__start_search` | Full-text search across Mac files |
| `mcp__Desktop_Commander__write_pdf` | Write a PDF to disk |

### Mac GUI Automation (AppleScript)
Use for controlling Mac apps that don't have browser interfaces — Finder, Calendar, Mail, Spotify, etc.

Tool: `mcp__Control_your_Mac__osascript`

```applescript
-- Example: Create a Finder folder
tell application "Finder" to make new folder at desktop with properties {name:"Output"}

-- Example: Open a URL in Safari
tell application "Safari" to open location "https://app.gohighlevel.com"

-- Example: Send a macOS notification
display notification "Pipeline check complete" with title "JARVIS" sound name "Ping"

-- Example: Get clipboard content
return the clipboard

-- Example: Activate an app
tell application "Google Chrome" to activate
```

### iMessage
Use for proactive alerts, daily briefings, or communication from JARVIS to the operator or contacts.

| Tool | Use For |
|------|---------|
| `mcp__Read_and_Send_iMessages__send_imessage` | Send a text/iMessage to any contact |
| `mcp__Read_and_Send_iMessages__read_imessages` | Read message history with a contact |
| `mcp__Read_and_Send_iMessages__get_unread_imessages` | Pull all unread messages |
| `mcp__Read_and_Send_iMessages__search_contacts` | Find a contact by name |

**Critical rule**: Always confirm recipient before sending. Use `search_contacts` first if unsure of phone number.

### Apple Notes
Use for quick saves, personal logs, or when operator needs notes synced to their iPhone/iPad.

| Tool | Use For |
|------|---------|
| `mcp__Read_and_Write_Apple_Notes__add_note` | Create a new note |
| `mcp__Read_and_Write_Apple_Notes__list_notes` | List all notes |
| `mcp__Read_and_Write_Apple_Notes__get_note_content` | Read a note's content |
| `mcp__Read_and_Write_Apple_Notes__update_note_content` | Edit an existing note |

---

## Decision Tree: Which Tool?

```
Task involves a website?
├── Just need to scrape/read content → Firecrawl FIRST (firecrawl_scrape or firecrawl_search)
│   └── Firecrawl blocked or login required → then use Chrome
├── Need to click/fill forms/interact → Claude in Chrome (full stack)
├── Just need to read the page (no Firecrawl) → Control Chrome (lightweight)
└── Need to intercept API calls → Claude in Chrome + read_network_requests

Task involves Mac files/processes?
├── Read/write files → Desktop Commander
├── Run a script or app → Desktop Commander start_process
└── Control a Mac app's GUI → osascript (AppleScript)

Task involves communication?
├── Send operator an alert → iMessage send_imessage
├── Read incoming messages → iMessage read/get_unread
└── Save a note to sync to iPhone → Apple Notes add_note
```

---

## Common Playbooks

### Scrape a pricing page
```
1. firecrawl_scrape URL → get clean Markdown (preferred — handles anti-bot automatically)
2. If Firecrawl is blocked or returns empty: navigate to URL in Chrome
3. get_page_text → extract pricing data
4. If blocked/JS-rendered: javascript_tool to execute document.querySelectorAll
5. Save to owners-inbox/research/
```

### Log into a web app
```
1. navigate to login page
2. find username field → form_input with email
3. find password field → form_input with password
4. find login button → computer (click by coordinates) OR javascript_tool click
5. read_page to confirm successful login
```

### Post to LinkedIn
```
1. navigate to linkedin.com/feed
2. find "Start a post" → computer click
3. form_input post text
4. find Post button → computer click
5. read_page to confirm post published
```

### Send JARVIS alert to operator
```
1. search_contacts "[operator name]" → get phone number
2. send_imessage with formatted message
```

### Run a Mac script
```
1. Desktop_Commander write_file to create script
2. Desktop_Commander start_process to execute it
3. Desktop_Commander read_process_output to get results
```

---

## Rules
- Always take a screenshot (read_page) to verify state before and after critical actions
- Never store passwords — use saved credentials in Chrome or prompt the operator
- For web scraping: check page load before extracting (use read_page first, not just get_page_text)
- Alert channel is for alerts only — don't spam; max 1 unsolicited message per scheduled task run
- If a browser task fails twice: save a screenshot, report the error with the screenshot path, ask the operator how to proceed
- AppleScript requires the Mac to be unlocked and the app to be installed
