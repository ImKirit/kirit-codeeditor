# Kode

> An open-source, AI-native code editor. Bring your own subscriptions. Own your workflow.

---

## About

**kirit-codeeditor** is a fully open-source code editor built for developers who want the power of AI-assisted coding without being locked into a single provider or platform. Connect your own Claude, Codex, Gemini, or Copilot subscriptions, run multiple AI sessions side by side, and watch your code take shape in real time — line by line, word by word.

Every panel, every pane, every color is yours to configure. The editor ships with sensible defaults and gets out of your way when you want to work, and steps up when you need AI.

---

## Features

### Editor Core

- Open folders and individual files from your filesystem
- Fully-featured code editor with syntax highlighting for all major languages
- File tree sidebar (VS Code style) — navigate, create, rename, delete
- File search: quick-open (Ctrl+P) and global workspace text search
- Multi-cursor editing, code folding, bracket matching
- Command palette (Ctrl+Shift+P) for all editor actions
- Split editor views — horizontal and vertical
- Customizable keybindings

---

### AI Integrations

Connect one or more of your own AI subscriptions. The editor never touches your API keys beyond passing them to the provider.

**Supported providers:**
- Claude (Anthropic)
- Codex / GPT models (OpenAI)
- Gemini (Google)
- GitHub Copilot
- More via the plugin system

**Per-provider features:**
- Add multiple subscriptions per provider (e.g. two separate Claude accounts)
- Choose your provider first, then select the exact model (e.g. Claude → Opus 4.7, Sonnet 4.6, Haiku 4.5)
- Model list stays up to date as providers release new versions

**Session controls:**
- Effort level — control how much compute/tokens the AI spends per response
- Plan mode — tell the AI to plan before acting
- Permission management (for providers that support it natively, such as Claude):
  - Always ask before performing an action
  - Always approve — skip permission prompts
  - Custom per-action rules
- For providers without native permission APIs: the editor intercepts and auto-accepts tool-use requests on your behalf

**Usage display** (shown in the chat footer):
- Weekly usage limit and remaining capacity
- Hourly rate limit status
- Current context window usage vs. maximum

---

### Real-Time AI Writing

See exactly what the AI is doing as it happens.

- File writes stream live: code appears character by character, word by word, line by line
- The editor highlights the exact line currently being written

**Auto Follow** toggle (in the chat header):
- When enabled, the editor automatically opens whichever file the AI is currently editing
- The view auto-scrolls to keep the latest written line visible at all times
- Turn it off to freely navigate while the AI works in the background

---

### AI Chat & Session Management

The AI chat panel runs as a dockable window (default position: right side).

**Inside each chat session:**

| Tab | What you see |
|---|---|
| Code | The currently selected file alongside the AI conversation |
| Changes | A git-diff-style view of every change made in this session |
| (extensible) | Add more tabs via plugins |

**Session features:**
- Full chat history — browse, search, and resume any past session
- Multiple AI sessions running simultaneously, each in its own tab
  - Example tab bar: `Terminal · Claude · Codex · Claude 2`
- Each session keeps its own context, model selection, and permission settings

---

### Scheduling & Automation

**Message scheduling:**
- Set a time and a prompt — the message fires automatically at the scheduled moment
- Scheduled messages are listed with their time (⧗ 14:30) and can be cancelled or edited

**Auto-resume on usage limit:**
- If a session ends because the provider rate limit was hit, you can configure a follow-up message to queue automatically
- When the limit resets, the editor sends it without you having to do anything
- Default: `"Continue exactly where you left off."`

**Post-completion prompts:**
- Define a prompt that fires automatically once the AI signals it is done
- Useful for automated test runs, review passes, or handing off to a second AI session

---

### Layout & Customization

The entire interface is modular. Every panel can be moved, resized, docked, undocked, or turned into a standalone window.

**Default layout:**
```
+------------------+---------------------------+------------------+
|                  |                           |                  |
|   File Tree      |       Editor              |    AI Chat       |
|   (left)         |       (center)            |    (right)       |
|                  |                           |                  |
+------------------+---------------------------+------------------+
|                                                                  |
|   Terminal / AI Sessions                    (bottom, tabbed)    |
|                                                                  |
+------------------------------------------------------------------+
```

**Docking system:**
- Drag a panel onto a **tab label** → merges into that tab group (switch between them)
- Drag a panel onto a **panel body** → splits the area (both visible side by side)
- Undock any panel → floats as a standalone window
- Re-dock a floating window by dragging it back into the layout
- Drag any border to resize panels

**Customization:**
- Default theme: dark gray background, white accents
- Everything is configurable: colors, fonts, sizes, spacing, icon sets, panel positions, tab behavior, keybindings
- Theme system exposes full CSS-level control for complete visual overrides
- Export and import themes — share your setup with others

---

### MCP Servers & Skills

The editor automatically discovers and loads configuration from your workspace's standard config folders.

- Loads MCP servers defined in `.claude/` (and equivalent folders for other providers)
- Loads skills, hooks, and settings files
- Everything that works in Claude Code CLI works here — no manual re-configuration

---

### Plugin System

Extend the editor with first-party and community plugins.

- Built-in plugin marketplace (browse, install, update in one place)
- Example plugins: Live Server, Prettier, ESLint, language packs, custom themes
- Plugin API for building your own extensions
- Plugins can add new panels, commands, AI providers, and chat tabs

---

### Integrated Terminal

- Open one or more terminal instances in the bottom panel
- Each terminal gets its own tab alongside AI sessions
- Full shell support — whatever your system runs, the terminal runs
- Resize, split, or pop out terminals like any other panel

---

### Git Integration

- Changes tab in each chat session shows a git-diff-style view of AI-made changes
- Stage, unstage, commit, push, pull, and switch branches directly in the editor
- Branch indicator in the status bar

---

## Roadmap

- [ ] Core editor (file tree, editor, terminal)
- [ ] Claude integration + streaming
- [ ] Codex / OpenAI integration
- [ ] Gemini integration
- [ ] Copilot integration
- [ ] Dockable layout engine
- [ ] Plugin marketplace
- [ ] MCP auto-discovery
- [ ] Message scheduling
- [ ] Auto-resume on rate limit
- [ ] Theme engine
- [ ] Language Server Protocol (LSP) support

---

## Contributing

kirit-codeeditor is fully open source and contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Open a pull request with a clear description

Please open an issue before starting large features so we can align on direction.

---

## License

MIT — see [LICENSE](LICENSE) for details.
