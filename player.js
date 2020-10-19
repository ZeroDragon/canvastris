let audioCtx
const beep = (duration, frequency, type) => {
  const oscillator = audioCtx.createOscillator()
  const gainNode = audioCtx.createGain()
  oscillator.connect(gainNode)
  gainNode.connect(audioCtx.destination)
  gainNode.gain.value = 0.05
  oscillator.type = type
  oscillator.frequency.value = frequency
  oscillator.start()
  const innerTimer = setTimeout(() => {
    clearTimeout(innerTimer)
    oscillator.stop()
  }, duration)
}
const noteTimers = {}
window.playNote = (song, notes, position, repeat, type) => {
  const [duration, frequency, silence] = notes[position]
  beep(duration, frequency, type)

  noteTimers[song] = setTimeout(() => {
    clearTimeout(noteTimers[song])
    const next = position + 1
    if (!notes[next]) {
      if (repeat) window.playNote(song, notes, 0, repeat, type)
      return
    }
    window.playNote(song, notes, next, repeat, type)
  }, duration + silence)
}
const startSong = (song, repeat = false, type = 'square') => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext)()
  window.playNote(song.toString(), window[song](), 0, repeat, type)
}
window.playSfx = (song, repeat = false, type = 'sawtooth') => {
  audioCtx = new (window.AudioContext || window.webkitAudioContext || window.audioContext)()
  window.playNote(song.toString(), song, 0, repeat, type)
}
let playingSong
window.toggleSong = (song, repeat = false) => {
  clearTimeout(noteTimers[song.toString()])
  if (playingSong !== song) {
    startSong(song, repeat)
    playingSong = song
  } else {
    playingSong = null
  }
}
window.startOrStopSong = (song, repeat, start) => {
  clearTimeout(noteTimers[song.toString()])
  if (start) {
    startSong(song, repeat)
    playingSong = song
  } else {
    playingSong = null
  }
}
