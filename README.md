[repo]: https://github.com/Ranzware/AzuraCast-Player/
[azuracast]: https://radio.mp3islam.com/
[audioapi]: https://developer.mozilla.org/en-US/docs/Web/API/AudioContext
[vue]: https://github.com/vuejs/vue
[node]: https://nodejs.org/

# Radio Quran — Modern Islamic AzuraCast Player

A modern, Islamic-themed web radio player for streaming Quran recitations from an AzuraCast server. Built with **Vue.js 3**, **Three.js**, and the **HTML5 Web Audio API**.

This project is a fork of the original [AzuraCast-Player](https://github.com/PeWe79/AzuraCast-Player) by PeWe79, itself based on [rainner/soma-fm-player](https://github.com/rainner/soma-fm-player). It has been redesigned with a dark navy, emerald green, and warm gold Islamic theme, and customized for [Mp3islam.com](https://mp3islam.com).

## Features

- 🕌 Modern Islamic design — dark navy, emerald, and gold palette
- 📻 Streams all radio stations from an AzuraCast server via its public API
- 🎧 Audio visualizer with a calm glowing emerald orb and crescent ring
- 💚 Central now-playing dashboard + station grid sidebar
- 🔍 Search and sort stations by name, listeners, favorites, or genre
- 💾 Save favorite stations locally and export as `.m3u` playlist
- 📱 Responsive layout for desktop and mobile

## Live Site

**[https://radio.mp3islam.com](https://radio.mp3islam.com)**

## Screenshots

![Radio Quran Player](thumb.png)
![Radio Quran Player Stations](thumb2.png)

## Installation

Clone the repository:

```bash
git clone https://github.com/Ranzware/AzuraCast-Player.git
cd AzuraCast-Player
```

### Configure your AzuraCast server

Edit `src/js/config.js` and set your AzuraCast base URL:

```javascript
export default {
  apiBaseUrl: 'https://radio.mp3islam.com'
}
```

### Image branding

Make sure your station branding images on the AzuraCast server are in **`.jpg`** format for compatibility with this configuration.

### Project setup

```bash
npm install
```

#### Compile for development

```bash
npm run dev
```

#### Start a local development server with hot reload

```bash
npm run init
```

#### Compile and minify for production

```bash
npm run build
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Build unminified bundle for development |
| `npm run build` | Build minified production bundle |
| `npm run init` | Serve with `live-server` |
| `npm run format` | Format source files with Prettier |

## Cover Artwork

- iTunes search API

## TODO / Roadmap

- [ ] Fetch cover artwork from additional sources
- [ ] Add song request form integration with AzuraCast
- [x] Station image branding support

## Author

**Ranzware**

- Repository: [https://github.com/Ranzware/AzuraCast-Player](https://github.com/Ranzware/AzuraCast-Player)
- Powered by [AzuraCast](https://www.azuracast.com/)

## License

Licensed under the [MIT License](https://www.opensource.org/licenses/mit-license.php).

## Credits

- Original project by [PeWe79](https://github.com/PeWe79/AzuraCast-Player)
- Based on [rainner/soma-fm-player](https://github.com/rainner/soma-fm-player)
- [Vue.js](https://vuejs.org/)
- [Three.js](https://threejs.org/)
