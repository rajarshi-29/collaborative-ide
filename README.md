# Collaborative IDE

A next-generation, high-performance **Collaborative Desktop IDE** built on Electron.js, featuring real-time pair programming, intelligent code editing, extensible modular architecture, and modern developer ergonomics.

---

## 🚀 Overview

**Collaborative IDE** provides a distraction-free, extensible environment tailored for distributed teams, pair programmers, and modern software developers. 

### Key Features
- ⚡ **Real-Time Collaboration Ready**: Built-in architecture for shared workspaces, multi-user live cursors, synchronized buffers, and peer presence.
- 🎨 **Modern Sleek Interface**: Clean dark theme with rich visual hierarchy, resizable docks, customizable status bar, and intuitive navigation.
- 📂 **Integrated Workspace & File Explorer**: Fast tree view with Git status indicators, file icons, and folder expand/collapse capabilities.
- 💻 **Advanced Code Editor**: Syntax highlighting across dozens of languages, multi-cursor editing, bracket matching, regex find & replace, and code folding.
- 🧭 **Command Palette**: Instant access to all editor commands, keybindings, and tools via `Ctrl+Shift+P` (or `Cmd+Shift+P`).
- ⚙️ **Comprehensive Settings & Theming**: Built-in theme manager supporting UI and syntax styling, package configuration, and custom keybinding overrides.

---

## 🛠️ Project Structure

```text
collaborative-ide/
├── exports/                  # CommonJS exports & environment bridge
├── keymaps/                  # Platform keybinding configurations
├── menus/                    # Application menus (Windows, macOS, Linux)
├── packages/                 # Built-in modular IDE packages
│   ├── about/                # Application info & version specs
│   ├── welcome/              # Modern Collaborative IDE Welcome Dashboard
│   ├── deprecation-cop/      # Runtime deprecation diagnostics
│   ├── git-diff/             # Git inline gutter diff indicators
│   ├── tree-view/            # Project file explorer panel
│   ├── status-bar/           # Bottom workspace status bar
│   └── ...                   # Language grammars & utilities
├── resources/                # App icons and packaging resources
├── src/                      # Core runtime and window management
│   ├── main-process/         # Electron Main Process entrypoints & lifecycle
│   ├── atom-environment.js   # IDE core environment coordinator
│   ├── workspace.js          # Workspace docks, panes, and layout manager
│   ├── text-editor.js        # Editor model & buffer integration
│   └── ...
└── static/                   # Renderer HTML entry point & stylesheets
```

---

## 🏁 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v14+ recommended)
- [Electron](https://www.electronjs.org/) (v11.5.0+)

### Running Locally
To launch the Collaborative IDE in development mode:

```bash
npm start
```

---

## ⌨️ Useful Keybindings

| Action | Windows / Linux | macOS |
| :--- | :--- | :--- |
| **Command Palette** | `Ctrl + Shift + P` | `Cmd + Shift + P` |
| **Open File / Project** | `Ctrl + O` | `Cmd + O` |
| **New File** | `Ctrl + N` | `Cmd + N` |
| **Save File** | `Ctrl + S` | `Cmd + S` |
| **Toggle Tree View** | `Ctrl + \` | `Cmd + \` |
| **Settings** | `Ctrl + ,` | `Cmd + ,` |
| **Find in Buffer** | `Ctrl + F` | `Cmd + F` |
| **Find in Project** | `Ctrl + Shift + F` | `Cmd + Shift + F` |

---

## 📄 License
MIT License.
