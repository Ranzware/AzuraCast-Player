/**
 * Audio handler object
 */
export default {
  _context: null,
  _audio: null,
  _source: null,
  _gain: null,
  _analyser: null,
  _freq: new Uint8Array(32),
  _hasfreq: false,
  _counter: 0,
  _events: {},
  _listeners: [],

  // setup audio routing, called after user interaction, setup once
  setupAudio() {
    if (this._audio && this._context) return

    this._audio = new Audio()
    this._context = new (window.AudioContext || window.webkitAudioContext)()
    this._source = this._context.createMediaElementSource(this._audio)
    this._analyser = this._context.createAnalyser()
    this._gain = this._context.createGain()

    this._analyser.fftSize = 32
    this._source.connect(this._analyser)
    this._source.connect(this._gain)
    this._gain.connect(this._context.destination)

    this._onCanPlay = () => {
      this._freq = new Uint8Array(this._analyser.frequencyBinCount)
      this._audio.play()
    }
    this._audio.addEventListener('canplay', this._onCanPlay)

    const events = ['waiting', 'playing', 'ended', 'stalled', 'error']
    this._listeners = []
    events.forEach((event) => {
      const handler = (e) => this.emit(event, e)
      this._listeners.push({ event, handler })
      this._audio.addEventListener(event, handler)
    })
  },

  // add event listeners to the audio api
  on(event, callback) {
    if (event && typeof callback === 'function') {
      this._events[event] = callback
    }
  },

  // emit saved audio event
  emit(event, data) {
    if (event && this._events.hasOwnProperty(event)) {
      this._events[event](data)
    }
  },

  // update and return analyser frequency value (0-1) to control animations
  getFreqData(playing) {
    if (!this._analyser) return 0

    // this is not working on some devices running safari
    this._analyser.getByteFrequencyData(this._freq)
    let _freq = Math.floor(this._freq[4] | 0) / 255

    // indicate that a freq value can be read
    if (!this._hasfreq && _freq) {
      this._hasfreq = true
    }

    // frequency data available
    if (this._hasfreq) return _freq

    // return fake counter if no freq data available (safari workaround)
    if (playing) {
      this._counter = this._counter < 0.6 ? this._counter + 0.01 : this._counter
    } else {
      this._counter = this._counter > 0 ? this._counter - 0.01 : this._counter
    }
    return this._counter
  },

  // set audio volume
  setVolume(volume) {
    if (!this._gain) return
    const v = parseFloat(volume)
    if (Number.isNaN(v)) return
    let normalized = Math.max(0, Math.min(1, v > 1 ? v / 100 : v))
    this._audio.muted = normalized <= 0
    this._gain.gain.value = normalized
  },

  // stop playing audio and release resources
  stopAudio() {
    if (this._audio) {
      try {
        this._audio.pause()
      } catch (e) {}
      this._audio.src = ''
      this._audio.removeAttribute('src')
      this._audio.load()
    }
    if (this._context && this._context.state !== 'closed') {
      try {
        this._context.suspend()
      } catch (e) {}
    }
    this._hasfreq = false
    this._counter = 0
  },

  // play audio source url
  playSource(source) {
    this.setupAudio()
    this.stopAudio()

    if (this._context.state === 'suspended') {
      this._context.resume().then(() => {
        console.log('Audio context has been resumed.')
      })
    }
    this._audio.src = String(source || '') + '?x=' + Date.now()
    this._audio.preload = 'metadata'
    this._audio.crossOrigin = 'anonymous'
    this._audio.autoplay = false
    this._audio.load()
  },

  // fully release audio resources
  destroy() {
    this.stopAudio()
    if (this._audio) {
      if (this._onCanPlay) this._audio.removeEventListener('canplay', this._onCanPlay)
      this._listeners.forEach(({ event, handler }) => {
        try {
          this._audio.removeEventListener(event, handler)
        } catch (e) {}
      })
      this._listeners = []
      this._audio = null
    }
    if (this._context && this._context.state !== 'closed') {
      try {
        this._context.close()
      } catch (e) {}
    }
    this._context = null
    this._source = null
    this._gain = null
    this._analyser = null
  },
}
