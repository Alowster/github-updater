# GitHub Updater

Keep your GitHub apps up to date from a single window. GitHub Updater monitors the repositories you choose and notifies you — or downloads automatically — whenever a new version is released.

## Download

Go to the [Releases](../../releases/latest) page and download the executable for your system.

No installation required: just open the `.exe` and you're good to go.

## Getting started

### 1. Add an application

Click **+ App** and fill in:

| Field | What to enter |
|---|---|
| **Name** | The name you want to see in the list |
| **Repository** | `user/repository` or the full GitHub URL |
| **Installed version** | The version you currently have (e.g. `v1.2.0`). Leave empty if not installed yet. |
| **Emoji / Icon** | An emoji to visually identify it (optional) |
| **Auto-update** | Enable to download new versions automatically without asking |

### 2. Check for updates

Click **Check** to scan all apps at once. Any app with a new version will be highlighted with an **Update** button.

If a release has multiple files, the app will ask you which one to download.

### 3. Settings

In the **Settings** tab you can configure:

- **GitHub Token** — required for private repositories and to raise the API limit from 60 to 5000 requests/hour. [Create token →](https://github.com/settings/tokens/new)
- **Check interval** — how often (in minutes) the app automatically checks for updates
- **Start with Windows** — launch the app when you log in
- **Minimize to tray** — keep the app running in the background when you close the window

## Troubleshooting

| Problem | Solution |
|---|---|
| "GitHub API error: 403" | You've hit the rate limit. Add a token in Settings |
| "GitHub API error: 404" | The repository doesn't exist or is private. Use a token with the `repo` scope |
| Not visible in the tray | Restart the app. On Windows it may be hidden in the overflow area of the taskbar |
| Version not detected | Make sure the installed version follows the format `v1.0.0` |
| No download button | That app's release has no attached files. Clicking Update will open the release page in your browser |

## License

MIT
