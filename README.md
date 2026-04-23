<img width="1200" height="630" alt="Polygol • Really good universial dashboard, made by kirbIndustries" src="https://github.com/user-attachments/assets/727d905f-48c4-4b27-ae0e-068b04059d56" />

🧑‍💻 Web desktop enviroment with applications and executables for your files. 

**[>> You can access Polygol Desktop at https://polygol.github.io/desktop <<]**

Documentation at https://kirbindustries.gitbook.io/polygol/desktop


> [!TIP]
> In development. may be unstable!!

# Features
* Based on Polygol
* Do stuff with your files with an easy block-based scripting interface 
* Cross device functionality with Waves
* Extensive wallpaper based customization with Custom CSS
* Integration with applications
* Beautiful Dynamic Glass UI

# What is this for?
Polygol Desktop is **NOT** designed to replace macOS, Windows, Linux, etc. It is supposed to be an extension for your host OS, allowing for file manipulation and applications to be run.

# Gurapp Applications
Gurapp can extend your Polygol experience. The GitHub repository for each application are seperate from the `polygol.github.io` GitHub repository.

# Boot States & URL Parameters
Polygol includes a Boot State System that runs immediately upon page load (before the OS initializes).

If a user visits index.html without any parameters and has not completed the setup process, they are automatically redirected to the landing page.

## Boot Commands
Control the startup behavior using the ?s= query parameter. The URL is automatically cleaned after the command executes.

| Parameter | Action | Description |
| :--- | :--- | :--- |
| `?s=oobe` | Force Setup | Clears the "visited" flag and forces the Out-of-Box Experience (Setup Screen) to launch. **This is NOT a factory reset. Use Recovery to wipe system data** |
| `?s=nooobe` | Skip Setup | Sets the "visited" flag to true and skips setup |
| `?s=manage&url=[URL]` | Import Config | Fetches a raw text/JS file from the provided `[URL]`, saves it as a `customStartupScript` |
| `?s=[AppName]` | Deep Link | Immediately launches the specified app once the system loads |

## Examples
* Reset and start fresh:
`https://polygol.github.io/?s=oobe`
* Skip setup entirely:
`https://polygol.github.io/?s=nooobe`
* Open the Terminal immediately:
`https://polygol.github.io/?s=Terminal`
* Load a custom configuration script:
`https://polygol.github.io/?s=manage&url=https://example.com/my-config.js`

# Local Run
* Applications: You must download the Gurapps from each GitHub repository and place them in the root directory in order for Gurapps to work correctly with Polygol locally.
* Assets: You must edit the directory path in the code, since every path assumes that the asset is in root.

# I HATE MISSING ASSETS
If you see images of Fanny BFDI, the assets could not be found. If you are running locally, make sure you have followed the steps.

# Forking
You must replace the contents of these folders:
* appicon
* img
* marketing

# Acknowledgements
See assets/about/external.md

---

© Copyright kirbIndustries 2024-2026

You are free to do anything to the code under CC BY-NC 4.0.

You may not use our brand in any method not authorized, including identifiable visual assets.

AI Notice: Some sections of code are generated with various AI models. However, AI is not used at all for visual assets, such as Gurapp Icons.

---

Please contact us at kirbind.manatee415@passinbox.com for removal/addition/modification requests
