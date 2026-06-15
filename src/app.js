/**
 * Main app JS entry file.
 */
import _api from './js/api'
import _audio from './js/audio'
import favBtn from './js/favorite'
import _scene from './js/scene'
import _store from './js/store'
import _utils from './js/utils'
import './scss/app.scss'

const { createApp } = Vue

// main vue app
const app = createApp({
  components: {
    favBtn,
  },

  data: () => {
    return {
      // toggles
      init: false,
      visible: true,
      playing: false,
      loading: false,
      sidebar: false,
      volume: 80,
      // sidebar toggles
      sbActive: false,
      sbVisible: false,
      // stations stuff
      route: '/',
      stations: [],
      station: {},
      songHistory: [],
      songHistoryAlbum: [],
      songNow: {},
      nextSong: {},
      nextPlay: {},
      npiTunes: {},
      nextitunes: {},
      songHistoryCoverArt: {},
      nowPlaying: {},
      favorites: [],
      errors: {},
      cache: {},
      // timer stuff
      timeStart: 0,
      timeDisplay: '00:00:00',
      timeItv: null,
      // sorting stuff
      searchText: '',
      sortParam: 'listeners',
      sortOrder: 'desc',
      // timer stuff
      anf: null,
      sto: null,
      itv: null,
    }
  },

  // watch methods
  watch: {
    // watch playing status
    playing() {
      if (this.playing) {
        this.startClock()
      } else {
        this.stopClock()
      }
    },

    // update player volume
    volume() {
      _audio.setVolume(this.volume)
    },
  },

  // computed methods
  computed: {
    // filter stations list
    channelsList() {
      let list = this.stations.slice()
      const search = this.searchText
        .replace(/[^\w\s\-]+/g, '')
        .replace(/[\r\s\t\n]+/g, ' ')
        .trim()

      if (search && search.length > 1) {
        list = _utils.search(list, 'name', search)
      }
      if (this.sortParam) {
        list = _utils.sort(list, this.sortParam, this.sortOrder, false)
      }
      const activeShortcode = this.station.shortcode
      return list.map((i) => ({
        ...i,
        active: activeShortcode === i.shortcode,
      }))
    },

    // sort-by label for buttons, etc
    sortLabel() {
      switch (this.sortParam) {
        case 'name':
          return 'Station Name'
        case 'listeners':
          return 'Listeners Count'
        case 'favorite':
          return 'Saved Favorites'
        case 'genre':
          return 'Mushaf / Genre'
      }
    },

    // check if audio can be played
    canPlay() {
      return this.station.shortcode && !this.loading ? true : false
    },

    // check if a station is selected
    hasStation() {
      return this.station.shortcode ? true : false
    },

    // check if there are historySong loaded
    hasHistorySongs() {
      return this.songHistory.length ? true : false
    },

    // check if statio support next song
    hasNextSong() {
      return this.nextSong.title ? true : false
    },

    // check for errors that would affect playback
    hasErrors() {
      if (this.errors.support || this.errors.stream) return true
      if (this.errors.stations && !this.stations.length) return true
      return false
    },
  },

  // custom methods
  methods: {
    // format number
    formatNumber(num) {
      return new Intl.NumberFormat('en-US').format(num)
    },

    // run maintenance tasks on a timer
    setupMaintenance() {
      this.itv = setInterval(() => {
        this.getChannels(this.sidebar) // update stations
        this.getSongs(this.station) // update station tracks
      }, 1000 * 30)
    },

    // set an erro message
    setError(key, err) {
      let errors = Object.assign({}, this.errors)
      errors[key] = String(err || '').trim()
      if (err) console.warn('ERROR(' + key + '):', String(err))
      this.errors = errors
    },

    // clear all error messages
    clearError(key) {
      let errors = Object.assign({}, this.errors)
      delete errors[key]
      this.errors = errors
    },

    // check if an error has been set for a key
    hasError(key) {
      return key && this.errors.hasOwnProperty(key)
    },

    // flush all errors
    flushErrors() {
      this.errors = {}
    },

    // show player when app is mounted
    setupEvents() {
      document.addEventListener('visibilitychange', () => {
        this.visible = document.visibilityState === 'visible'
        if (this.playing && this.visible) {
          this.updateCanvas()
        }
      })
      this._hashChangeHandler = () => this.applyRoute(window.location.hash)
      window.addEventListener('hashchange', this._hashChangeHandler)
      window.addEventListener('keydown', this.onKeyboard)
      // audio related events
      _audio.on('waiting', this.onWaiting)
      _audio.on('playing', this.onPlaying)
      _audio.on('ended', this.onEnded)
      _audio.on('error', this.onError)
      _audio.on('canplay', this.onPlaying)
    },

    // hide spinner and show player
    initPlayer() {
      setTimeout(() => {
        const spnr = document.querySelector('#_spnr')
        const wrap = document.querySelector('#player-wrap')
        if (spnr) spnr.style.display = 'none'
        if (wrap) wrap.style.opacity = '1'
        this.init = true
      }, 100)
    },

    // reset selected station
    resetPlayer() {
      this.closeAudio()
      this.flushErrors()
      this.station = {}
      this.songHistory = []
      this.songHistoryAlbum = []
      this.songHistoryCoverArt = []
    },

    // try resuming stream problem if possible
    tryAgain() {
      if (this.hasError('support')) {
        this.flushErrors()
        setTimeout(this.setupAudio, 1)
      } else {
        this.flushErrors()
        this.playChannel(this.station)
      }
    },

    // show/hide the sidebar
    toggleSidebar(toggle) {
      const state = typeof toggle === 'boolean' ? toggle : false
      if (state) {
        this.sbActive = true // bring to front
        this.sbVisible = true // show drawer
        this.$nextTick(() => {
          if (this.$refs.sidebarDrawer) this.$refs.sidebarDrawer.focus()
        })
      } else {
        this.sbVisible = false
        setTimeout(() => {
          this.sbActive = false
        }, 500)
      }
    },

    // toggle stream playback for current selected station
    togglePlay(e) {
      e && e.preventDefault()
      if (this.loading) return
      if (this.playing) return this.closeAudio()
      this.playChannel(this.station)
    },

    // save volume to store
    saveVolume() {
      _store.set('player_volume', this.volume)
    },

    // load saved volume from store
    loadVolume() {
      const vol = parseInt(_store.get('player_volume')) || 80
      this.volume = vol
    },

    // load last sort options from store
    loadSortOptions() {
      const opts = _store.get('sorting_data')
      if (opts && opts.param) this.sortParam = opts.param
      if (opts && opts.order) this.sortOrder = opts.order
    },

    // toggle sort order
    toggleSortOrder() {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
    },

    // apply sorting and toggle order
    sortBy(param, order) {
      if (this.sortParam === param) {
        this.toggleSortOrder()
      } else {
        this.sortOrder = order || 'asc'
      }
      this.sortParam = param
      _store.set('sorting_data', {
        param: this.sortParam,
        order: this.sortOrder,
      })
    },

    // load saved favs list from store
    loadFavorites() {
      const favs = _store.get('favorites_data')
      if (!Array.isArray(favs)) return
      this.favorites = favs
    },

    // save favs to a .m3u file
    saveFavorites() {
      let data = '#EXTM3U'
      for (let id of this.favorites) {
        const station = this.stations.filter((c) => c.shortcode === id).shift()
        if (!station) continue
        data += '\n\n'
        data += `#EXTINF:0,${station.title} [AzuraCast]\n`
        data += `${station.mp3file}`
      }
      const elm = document.createElement('a')
      elm.setAttribute('href', 'data:audio/mpegurl;charset=utf-8,' + encodeURIComponent(data))
      elm.setAttribute('download', 'azuracast_favorites.m3u')
      elm.setAttribute('target', '_blank')
      document.body.appendChild(elm)
      setTimeout(() => elm.click(), 100)
      setTimeout(() => elm.remove(), 1000)
    },

    // toggle favorite station by id
    toggleFavorite(id, toggle) {
      let favs = this.favorites.slice()
      favs = favs.filter((fid) => fid !== id)
      if (toggle) favs.push(id)
      this.favorites = favs
      this.updateCurrentChannel()
      _store.set('favorites_data', favs)
    },

    // close active audio
    closeAudio() {
      _audio.stopAudio()
      this.playing = false
    },

    // setup animation canvas
    setupCanvas() {
      _scene.setupCanvas()
    },

    // audio visualizer animation loop
    updateCanvas() {
      if (!this.visible || !this.playing) {
        this.anf = null
        return
      }
      const freq = _audio.getFreqData(this.playing)
      _scene.updateObjects(freq)
      this.anf = requestAnimationFrame(this.updateCanvas)
    },

    // get stations data from api
    getChannels(sidebar) {
      _api.getChannels((err, stations) => {
        if (err) return this.setError('stations', err)
        this.stations = Array.isArray(stations) ? Object.freeze(stations) : []
        this.clearError('stations')
        this.updateCurrentChannel()
        this.applyRoute(window.location.hash, sidebar)
      })
    },

    // get songs list for a station from api
    getSongs(station, cb) {
      if (!station || !station.shortcode || !station.songsurl) return
      // abort pending requests and store current station token
      this._abortSongs()
      this._songsToken = station.shortcode
      if (!this.isCurrentChannel(station)) {
        this.songNow = {}
        this.nowPlaying = {}
        this.nextSong = {}
        this.nextPlay = {}
      }

      _api.getSongs(station, this._songsController.signal, async (err, np) => {
        if (err) return this.setError('np', err)
        if (this._songsToken !== station.shortcode) return
        if (typeof cb === 'function') cb(np)
        this.songNow = np.now_playing.song
        this.nowPlaying = np.now_playing
        this.nextSong = np.playing_next ? np.playing_next.song : {}
        this.nextPlay = np.playing_next || {}
        document.title = this.sanitizeTitle(np.now_playing.song.text)
        const historySong = np.song_history || []
        this.clearError('np')

        this.nowPlayingData(this.songNow)
        this.nextPlayingData(this.nextSong)
        this.histPlayingData(historySong)
      })
    },

    // abort pending songs/iTunes requests
    _abortSongs() {
      if (this._songsController) this._songsController.abort()
      this._songsController = new AbortController()
    },

    // sanitize document title from remote data
    sanitizeTitle(text) {
      return String(text || '')
        .replace(/[ --]/g, '')
        .slice(0, 120)
    },

    // in-memory cache for iTunes artwork/metadata
    _itunesCache: new Map(),

    async getDataFrom(n) {
      if (!n || !n.text) {
        return { title: n.title, artist: n.artist, album: n.album, artworkUrl: n.art }
      }
      const key = n.text
      if (this._itunesCache.has(key)) return this._itunesCache.get(key)
      const dataFrom = await this.getiTunes(n)
      if (this._itunesCache.size > 200) this._itunesCache.delete(this._itunesCache.keys().next().value)
      this._itunesCache.set(key, dataFrom)
      return dataFrom
    },

    async getiTunes(t, signal) {
      const track = t.text
      const url = `https://itunes.apple.com/search?limit=1&media=music&term=${encodeURIComponent(track)}`
      try {
        const resp = await fetch(url, { signal })

        if (resp.status === 403) {
          return { title: t.title, artist: t.artist, album: t.album, artworkUrl: t.art }
        }

        const data = resp.ok ? await resp.json() : {}
        if (!data.results || data.results.length === 0) {
          return { title: t.title, artist: t.artist, album: t.album, artworkUrl: t.art }
        }

        const itunes = data.results[0]
        return {
          title: itunes.trackName || t.title,
          artist: itunes.artistName || t.artist,
          album: itunes.collectionName || t.album,
          artworkUrl: itunes.artworkUrl100
            ? itunes.artworkUrl100.replace('100x100', '512x512')
            : t.art,
        }
      } catch (e) {
        if (e.name === 'AbortError') return { title: t.title, artist: t.artist, album: t.album, artworkUrl: t.art }
        return { title: t.title, artist: t.artist, album: t.album, artworkUrl: t.art }
      }
    },

    async nowPlayingData(t) {
      const s = await this.getDataFrom(t)
      this.npiTunes = s
    },

    async nextPlayingData(t) {
      const s = await this.getDataFrom(t)
      this.nextitunes = s
    },

    async histPlayingData(t) {
      this.songHistory = t.slice(0, 5)
      this.songHistoryCoverArt = {}
      this.songHistoryAlbum = {}
      for (let index = 0; index < this.songHistory.length; index++) {
        const data = this.songHistory[index].song
        if (!data || !data.text) continue
        try {
          const item = await this.getDataFrom(data)
          this.songHistoryCoverArt[index] = item.artworkUrl
          this.songHistoryAlbum[index] = item.album
        } catch (e) {
          // ignore aborted/stale lookups
        }
      }
    },

    // checks is a station is currently selected
    isCurrentChannel(station) {
      if (!station || !station.shortcode || !this.station.shortcode) return false
      if (this.station.shortcode !== station.shortcode) return false
      return true
    },

    // update data for current selected channel
    updateCurrentChannel() {
      const currentShortcode = this.station.shortcode || ''
      for (let c of this.stations) {
        // see if channel has been saved as a favorite
        c.favorite = this.favorites.indexOf(c.shortcode) >= 0
        // see if channel is currently selected
        c.active = currentShortcode && currentShortcode === c.shortcode
      }
      if (currentShortcode) {
        const current = this.stations.find((c) => c.shortcode === currentShortcode)
        if (current) this.station = Object.assign({}, this.station, current)
      }
    },

    // play audio stream for a station
    playChannel(station) {
      if (this.playing || !station || !station.mp3file) return
      this.loading = true
      _audio.playSource(station.mp3file)
      _audio.setVolume(this.volume)
    },

    // select a station to play
    selectChannel(station, play = false) {
      if (!station || !station.shortcode) return
      if (this.isCurrentChannel(station)) return
      this.closeAudio()
      this.toggleSidebar(false)
      this.setRoute(station.route)
      this.getSongs(station)
      this.station = station
      // attempt to play only after user insteraction, triggered from clicking a station on the list
      if (play) {
        this.playChannel(station)
      }
    },

    // set station route
    setRoute(route) {
      route =
        '/' +
        String(route || '')
          .replace(/^[\#\/]+|[\/]+$/g, '')
          .trim()
      window.location.hash = route
      this.route = route
    },

    // parse url hash route actions
    applyRoute(route, sidebar = false) {
      const data = String(route || '')
        .replace(/^[\#\/]+|[\/]+$/g, '')
        .trim()
        .split('/')
      const action = data.length ? data.shift() : ''
      const param = data.length ? data.shift() : ''

      // select a station from the url
      if (action === 'station' && param) {
        const station = this.stations.filter((c) => c.shortcode === param).shift()
        if (station && station.shortcode) {
          return this.selectChannel(station)
        }
      }
      // nothing to do, reset player
      this.closeAudio()
      this.resetPlayer()
      this.toggleSidebar(sidebar)
    },

    // on keyboard events
    onKeyboard(e) {
      const k = e.key || ''
      if (k === ' ' && this.station.shortcode) return this.togglePlay()
      if (k === 'Enter') return this.toggleSidebar(true)
      if (k === 'Escape') return this.toggleSidebar(false)
    },

    // waiting for media to load
    onWaiting(e) {
      if (this.sto) clearInterval(this.sto)
      this.sto = setTimeout(() => this.onError(e), 10000)
      this.playing = false
      this.loading = true
    },

    // audio stream playing
    onPlaying() {
      this.clearError('stream')
      this.playing = true
      this.loading = false
      if (!this.anf) this.updateCanvas()
    },

    // audio stream ended
    onEnded() {
      this.playing = false
      this.loading = false
    },

    // error loading stream
    onError(e) {
      this.closeAudio()
      const title = this.station.title || 'Unknown station'
      this.setError(
        'stream',
        `The selected stream (${title}) could not load, or stopped loading due to network problems.`,
      )
      this.playing = false
      this.loading = false
      console.error('Audio error:', e && e.message)
    },

    // start tracking playback time
    startClock() {
      this.stopClock()
      this.timeStart = Date.now()
      this.timeItv = setInterval(this.updateClock, 1000)
      this.updateClock()
    },

    // update tracking playback time
    updateClock() {
      let p = (n) => (n < 10 ? '0' + n : '' + n)
      let elapsed = (Date.now() - this.timeStart) / 1000
      let seconds = Math.floor(elapsed % 60)
      let minutes = Math.floor((elapsed / 60) % 60)
      let hours = Math.floor(elapsed / 3600)
      this.timeDisplay = p(hours) + ':' + p(minutes) + ':' + p(seconds)
    },

    // stop tracking playback time
    stopClock() {
      if (this.timeItv) clearInterval(this.timeItv)
      this.timeItv = null
    },

    // clear timer refs
    clearTimers() {
      if (this.sto) clearTimeout(this.sto)
      if (this.itv) clearInterval(this.itv)
      if (this.anf) cancelAnimationFrame(this.anf)
    },

    // convert timestamp get playing at
    getPlayAt(numeric) {
      const date = new Date(numeric * 1000)
      const options = { hour: '2-digit', minute: '2-digit' }
      return date.toLocaleTimeString('en-us', options)
    },

    // pass height property to css
    setCssHeight(elm, height) {
      elm.style.setProperty('--height', `${height}px`)
    },

    // keep track of window height
    updateHeight() {
      if (this._resizeHandler) return
      const root = document.querySelector(':root')
      let lastHeight = window.innerHeight
      this.setCssHeight(root, lastHeight)
      this._resizeHandler = () => {
        const h = window.innerHeight
        if (h === lastHeight) return
        lastHeight = h
        this.setCssHeight(root, h)
      }
      window.addEventListener('resize', this._resizeHandler)
    },

    // ...
  },

  // on app mounted
  mounted() {
    this.loadSortOptions()
    this.loadFavorites()
    this.loadVolume()
    this.setupEvents()
    this.getChannels(true)
    this.setupCanvas()
    this.updateCanvas()
    this.setupMaintenance()
    this.updateHeight()
    this.initPlayer()
  },

  // on app destroyed
  destroyed() {
    this.closeAudio()
    this.clearTimers()
    this._abortSongs()
    if (this._hashChangeHandler) window.removeEventListener('hashchange', this._hashChangeHandler)
    if (this._resizeHandler) window.removeEventListener('resize', this._resizeHandler)
    window.removeEventListener('keydown', this.onKeyboard)
    _scene.destroy()
  },
})

app.mount('#app')
