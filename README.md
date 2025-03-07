# Discord Rich Presence Emulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Discord](https://img.shields.io/badge/Discord-Rich%20Presence-7289DA?logo=discord&logoColor=white)](https://discord.com/developers/docs/rich-presence/how-to)
[![Electron](https://img.shields.io/badge/Electron-v28.0.0-47848F?logo=electron&logoColor=white)](https://www.electronjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.x-blue?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-14%2B-green?logo=node.js&logoColor=white)](https://nodejs.org/)
[![GitHub Stars](https://img.shields.io/github/stars/i358/dRPC?style=social)](https://github.com/i358/dRPC/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Maintenance](https://img.shields.io/badge/Maintained%3F-yes-green.svg)](https://github.com/i358/dRPC/graphs/commit-activity)

A powerful and user-friendly Discord Rich Presence customization tool built with Electron.

> [!IMPORTANT]
> ## Prerequisites
> - Node.js (v14 or higher) [![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
> - Discord Desktop Application [![Discord](https://img.shields.io/badge/Discord-Required-5865F2?logo=discord&logoColor=white)](https://discord.com/)
> - A Discord Application (for Client ID) [![Developer Portal](https://img.shields.io/badge/Discord-Developer%20Portal-5865F2?logo=discord&logoColor=white)](https://discord.com/developers/applications)

## Features
- 🔌 Easy connection management with Discord [![Status](https://img.shields.io/badge/Status-Online-success)]()
- 🎮 Real-time Rich Presence updates [![Update](https://img.shields.io/badge/Updates-Real--time-blue)]()
- 🖼️ Custom image support (large and small) [![Images](https://img.shields.io/badge/Images-Supported-orange)]()
- 🔗 Interactive buttons with custom URLs [![Buttons](https://img.shields.io/badge/Buttons-Custom%20URLs-blueviolet)]()
- ⏱️ Elapsed time display and customization [![Time](https://img.shields.io/badge/Time-Tracking-yellowgreen)]()
- 👥 Party size and party information [![Party](https://img.shields.io/badge/Party-Info-lightgrey)]()
- 🔐 Secure Client ID storage using .env [![Security](https://img.shields.io/badge/Security-Enhanced-red)]()
- 💾 Settings persistence across sessions [![Storage](https://img.shields.io/badge/Storage-Persistent-informational)]()

## 📸 Screenshots

<p align="center"><em>Main Interface - Rich Presence Configuration and Preview</em></p>
<div align="center">
  <img src="assets/1.png" alt="Main Interface" width="400"/>
</div>

<p></p>

<div align="center">
  <img src="assets/2.png" alt="Image Settings" width="400"/>
</div>

<p></p>

<div align="center">
  <img src="assets/3.png" alt="Button Configuration" width="400"/>
</div>

<p></p>

<div align="center">
  <img src="assets/4.png" alt="Party Settings" width="400"/>
</div>

> [!NOTE]
> ## Setup Instructions
> 
> ### 1. Creating a Discord Application
> 1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
> 2. Click "New Application" and give it a name
> 3. Navigate to the "Rich Presence" section
> 4. Upload your assets (images) if you plan to use them
> 5. Copy your Client ID from the "General Information" section
> 
> ### 2. Environment Configuration
> 1. Create a `.env` file in the project root
> 2. Add your Client ID:
> ```env
> CLIENT_ID=your_client_id_here
> ```
> 
> ### 3. Installation
> ```bash
> # Install dependencies
> npm install
> 
> # Build the application
> npm run build
> 
> # Start the application
> npm start
> ```

> [!NOTE]
> ## Usage Guide
> 
> ### Basic Setup
> 1. Launch the application
> 2. Enter your Client ID or click the ".env" button to load it automatically
> 3. Click "Connect" to establish Discord connection
> 
> ### Rich Presence Configuration
> 
> #### Text Display
> - **Details Line**: Main activity description
> - **State Line**: Secondary status information
> 
> #### Images
> - **Large Image**: Primary image display
>   - Key: Asset name from Discord Developer Portal
>   - Text: Hover text for the image
> - **Small Image**: Secondary image display
>   - Key: Asset name from Discord Developer Portal
>   - Text: Hover text for the image
> 
> #### Buttons
> - Configure up to 2 buttons
> - Each button requires:
>   - Label: Button text
>   - URL: Valid HTTPS URL
> 
> #### Time Tracking
> - Set custom elapsed time
> - Input hours, minutes, and seconds
> - Click "Set" to update
> 
> #### Party Information
> - Set current and maximum party size
> - View automatically generated:
>   - Party ID
>   - Join Secret
>   - Match Secret

> [!WARNING]
> ## Important Notes
> - Discord application must be running
> - Client ID must be valid
> - Image keys must match assets uploaded to Discord Developer Portal
> - URLs must start with HTTPS
> - Button labels must not be empty if URL is provided
> - Details or State must be at least 2 characters long

> [!NOTE]
> ## Troubleshooting
> 1. If connection fails:
>    - Verify Discord is running
>    - Check Client ID validity
>    - Restart the application
> 
> 2. If images don't appear:
>    - Verify asset names in Developer Portal
>    - Wait a few minutes for Discord to process new assets
>    - Ensure correct case sensitivity in image keys
> 
> 3. If buttons don't work:
>    - Verify URLs start with HTTPS
>    - Ensure both label and URL are provided
>    - Check URL validity

> [!CAUTION]
> ## Security
> - Never share your Client ID publicly
> - Use .env file for Client ID storage
> - Keep your Discord application credentials secure

## Contributing
Contributions are welcome! Please feel free to submit pull requests to the [GitHub repository](https://github.com/i358/dRPC).

## License
This project is licensed under the MIT License - see the [LICENSE](https://github.com/i358/dRPC/blob/main/LICENSE) file for details. 

---
Made with ❤️ by [i358](https://github.com/i358) 