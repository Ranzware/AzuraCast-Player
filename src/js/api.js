/**
 * AzuraCast API handler
 */

import config from './config'

function isSafeUrl(url) {
  try {
    const u = new URL(url, window.location.origin)
    return ['http:', 'https:'].includes(u.protocol)
  } catch (e) {
    return false
  }
}

export default {
  // get station data from api
  getChannels(callback) {
    const apiurl = config.apiBaseUrl + '/api/stations'
    const error = 'There was a problem fetching the latest list of music channels from AzuraCast.'

    if (!isSafeUrl(apiurl)) return callback(error, [])

    fetch(apiurl)
      .then((e) => e.json())
      .then((res) => {
        const list = this._parseChannels(res)
        if (!list.length) return callback(error, [])
        return callback(null, list)
      })
      .catch((e) => {
        return callback(error + ' ' + String(e.message || ''), [])
      })
  },

  // fetch songs for a channel
  getSongs(channel, signal, callback) {
    const apiurl = channel.songsurl || ''
    const title = channel.name || '...'
    const error =
      'There was a problem loading the list of songs for channel ' + title + ' from AzuraCast.'

    if (!isSafeUrl(apiurl)) return callback(error, [])

    fetch(apiurl, { signal })
      .then((e) => e.json())
      .then((res) => {
        if (!res) return callback(error, [])
        return callback(null, res)
      })
      .catch((e) => {
        if (e.name === 'AbortError') return
        return callback(error + ' ' + String(e.message || ''), [])
      })
  },

  // parse station list from api response
  _parseChannels(station) {
    let output = []
    const randomNumber = Math.floor(Math.random() * 5)
    const extension = '.jpg'
    if (Array.isArray(station)) {
      for (let c of station) {
        if (!c || typeof c !== 'object') continue
        c.plsfile = c.playlist_pls_url || ''
        c.mp3file = c.listen_url || ''
        c.songsurl = config.apiBaseUrl + '/api/nowplaying/' + encodeURIComponent(c.id || '')
        c.infourl = c.url || ''
        c.twitter = c.twitter ? 'https://twitter.com/' + encodeURIComponent(String(c.twitter)) : ''
        c.route = '/station/' + encodeURIComponent(c.shortcode || '')
        c.listeners = c.mounts && c.mounts[0] ? c.mounts[0].listeners.current | 0 : 0
        c.updated = c.updated | 0
        c.favorite = false
        c.active = false
        c.imgLogo = c.shortcode
          ? config.apiBaseUrl +
            '/static/uploads/' +
            encodeURIComponent(c.shortcode) +
            '/album_art.' +
            randomNumber +
            extension
          : ''
        output.push(c)
      }
    }
    return output
  },
}
