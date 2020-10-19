/* globals tableOfFreq */
window.sfx = {
  poof: (beat = 50) => {
    const frequencies = ['C4']
    const durations = [1]
    return frequencies.map((note, index) => {
      return [
        durations[index] * beat,
        tableOfFreq[note] || 0,
        10
      ]
    })
  },
  gameOver: (beat = 50) => {
    const frequencies = ['C3', ' ', 'C2', 'C2']
    const durations = [1, 3, 3, 3]
    return frequencies.map((note, index) => {
      return [
        durations[index] * beat,
        tableOfFreq[note] || 0,
        10
      ]
    })
  },
  completedLines: (beat = 50, lines) => {
    const frequencies = {
      1: ['C3', 'D3'],
      2: ['D3', 'D4'],
      3: ['E3', 'E4', 'E5'],
      4: ['F3', 'F4', 'F5', 'F6']
    }[lines]
    const durations = [2, 2, 3, 3]
    return frequencies.map((note, index) => {
      return [
        durations[index] * beat,
        tableOfFreq[note] || 0,
        10
      ]
    })
  }
}
