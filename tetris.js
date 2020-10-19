/* globals conn */
const canvas = document.createElement('canvas')
const width = 400
const height = 590
let score = 0
const scoreTable = [0, 100, 250, 500, 1000]
let gameLevel = 1
let isPaused = false
const zeroes = {
  x: 10,
  y: 80
}
const fieldSize = { x: 10, y: 20 }
const squareSize = 25
let savedFaller
canvas.id = 'tetris'
canvas.width = width
canvas.height = height
document.body.appendChild(canvas)
const ctx = canvas.getContext('2d')
let gameLoopInteval
let fallers
let gameGrid
let remoteGrid = [[]]
let punishment = []
/* tetrinos */
const tetrinos = {
  teewee: {
    shape: [
      [1, 1, 1],
      [0, 1, 0]
    ],
    color: '#81C784'
  },
  cleveland: {
    shape: [
      [1, 1, 0],
      [0, 1, 1]
    ],
    color: '#FFB74D'
  },
  rodeIsland: {
    shape: [
      [0, 1, 1],
      [1, 1, 0]
    ],
    color: '#FF8A65'
  },
  ricky: {
    shape: [
      [0, 0, 1],
      [1, 1, 1]
    ],
    color: '#90A4AE'
  },
  morty: {
    shape: [
      [1, 0, 0],
      [1, 1, 1]
    ],
    color: '#AE90A4'
  },
  hero: {
    shape: [
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0],
      [0, 1, 0]
    ],
    color: '#BA68C8'
  },
  smashboy: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: '#7986CB'
  }
}

class Faller {
  constructor () {
    this.type = this.getPiece()
    this.piece = JSON.parse(JSON.stringify(tetrinos[this.type]))
    this.rotation = 0
    this.position = {
      x: Math.round(fieldSize.x / 2 - Math.floor(this.piece.shape[0].length / 2)),
      y: 0
    }
  }
  getPiece () {
    const canditates = Object.keys(tetrinos)
    return canditates[Math.floor(Math.random() * canditates.length)]
  }
}

const reset = () => {
  gameGrid = [...new Array(20)].map(() => {
    return [...new Array(10)].map(() => 0)
  })
  fallers = []
  fallers.push(new Faller())
  fallers.push(new Faller())
  clearTimeout(gameLoopInteval)
  clearTimeout(gravityTimer)
  isPaused = false
  punishment = []
  gameloop()
  gravity()
}

const flipMatrix = matrix => (
  matrix[0].map((column, index) => (
    matrix.map(row => row[index])
  ))
)

const rotate = matrix => {
  let cloned = JSON.parse(JSON.stringify(matrix))
  return flipMatrix(cloned.reverse())
}

const counterRotate = matrix => {
  const cloned = JSON.parse(JSON.stringify(matrix))
  return flipMatrix(cloned).reverse()
}

const gameOver = () => {
  clearTimeout(gravityTimer)
  clearTimeout(gameLoopInteval)
  fallers[0] = null
  ctx.fillStyle = '#000000'
  ctx.fillRect(50, 250, 310, 50)
  ctx.fillStyle = '#ffffff'
  ctx.font = `30px 'Press Start 2P', cursive`
  ctx.fillText('Game Over', 75, 290)
  window.playSfx(window.sfx.gameOver())
  isPaused = true
  window.startOrStopSong('tetrisSong', true, false)
  throw (new Error('game over'))
}

const autoPosition = ghost => {
  ghost.position.x -= 1
  if (canMove('right', ghost)) {
    return true
  }
  if (ghost.position.x === 0) return false
  return autoPosition(ghost)
}

const tryRotate = faller => {
  const ghost = JSON.parse(JSON.stringify(faller))
  const { piece } = ghost
  if (ghost.rotation > 0) piece.shape = rotate(piece.shape)
  if (ghost.rotation < 0) piece.shape = counterRotate(piece.shape)
  if (ghost.position.x > 0) {
    if (autoPosition(ghost)) {
      faller.position.x = ghost.position.x + 1
      faller.piece.shape = ghost.piece.shape
    } else {
      gameOver()
      return
    }
  } else {
    faller.piece.shape = ghost.piece.shape
  }
  faller.rotation = 0
}

const drawFaller = () => {
  const faller = fallers[0]
  if (!faller) return
  const { piece } = faller
  tryRotate(faller)
  piece.shape.forEach((row, offsetY) => {
    row.forEach((cell, offsetX) => {
      if (cell === 0) return
      ctx.fillStyle = piece.color
      ctx.fillRect(
        zeroes.x + faller.position.x * squareSize + offsetX * squareSize,
        zeroes.y + faller.position.y * squareSize + offsetY * squareSize,
        squareSize,
        squareSize
      )
    })
  })
  drawGhost()
}
const hex2rgba = hex => {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const a = parseInt(hex.slice(7, 9), 16) / 255
  return `rgba(${r},${g},${b},${a})`
}

const drawGhost = (faller = fallers[0]) => {
  if (!faller) return
  const ghost = JSON.parse(JSON.stringify(faller))
  const goDown = canMove('down', ghost)
  if (goDown) {
    ghost.position.y += 1
    drawGhost(ghost)
    return
  }
  const { piece } = ghost
  piece.shape.forEach((row, offsetY) => {
    row.forEach((cell, offsetX) => {
      if (cell === 0) return
      ctx.fillStyle = hex2rgba(`${piece.color}55`)
      ctx.fillRect(
        zeroes.x + ghost.position.x * squareSize + offsetX * squareSize,
        zeroes.y + ghost.position.y * squareSize + offsetY * squareSize,
        squareSize,
        squareSize
      )
    })
  })
}

const drawNextFaller = (nextFaller = fallers[1], squareSizeBis = 15, top = zeroes.y) => {
  if (!nextFaller) return
  const { piece } = nextFaller
  const left = squareSize * 10 + 20
  const pieceSize = {
    width: piece.shape[0].length * squareSizeBis,
    height: piece.shape.length * squareSizeBis
  }
  ctx.fillStyle = '#ddddff'
  // nextpiece
  ctx.fillRect(
    left,
    top,
    squareSizeBis * 5,
    squareSizeBis * 5
  )
  piece.shape.forEach((row, offsetY) => {
    row.forEach((cell, offsetX) => {
      if (cell === 0) return
      ctx.fillStyle = piece.color
      ctx.fillRect(
        left + squareSizeBis * 2.5 - pieceSize.width / 2 + offsetX * squareSizeBis,
        top + squareSizeBis * 2.5 - pieceSize.height / 2 + offsetY * squareSizeBis,
        squareSizeBis,
        squareSizeBis
      )
    })
  })
}

const saveFaller = () => {
  if (isPaused) return
  if (!savedFaller) {
    savedFaller = fallers.shift()
    savedFaller.position.y = 0
    savedFaller.position.x = 4
    fallers.push(new Faller())
  } else {
    const tempFaller = JSON.parse(JSON.stringify(savedFaller))
    tempFaller.position.y = 0
    tempFaller.position.x = 4
    savedFaller = fallers.shift()
    fallers.unshift(tempFaller)
  }
  fallers = fallers.slice(0, 2)
}

const drawGrid = () => {
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(
    zeroes.x,
    zeroes.y,
    squareSize * 10,
    squareSize * 20
  )
  ctx.fillStyle = '#cccccc'
  gameGrid.forEach((row, cellKey) => {
    row.forEach((cell, rowKey) => {
      if (!cell) return
      ctx.fillRect(
        zeroes.x + rowKey * squareSize,
        zeroes.y + cellKey * squareSize,
        squareSize,
        squareSize
      )
    })
  })
}

const drawRemoteGrid = () => {
  const remoteBlockSize = 8.4
  const remoteSize = {
    width: remoteBlockSize * fieldSize.x,
    height: remoteBlockSize * fieldSize.y
  }
  const left = width - remoteSize.width - 10
  const top = height - remoteSize.height - 10
  ctx.fillStyle = '#444444'
  ctx.fillRect(
    left,
    top,
    remoteSize.width,
    remoteSize.height
  )
  ctx.fillStyle = '#cccccc'
  remoteGrid.forEach((row, cellKey) => {
    row.forEach((cell, rowKey) => {
      if (!cell) return
      ctx.fillRect(
        left + rowKey * remoteBlockSize,
        top + cellKey * remoteBlockSize,
        remoteBlockSize,
        remoteBlockSize
      )
    })
  })
}
const applyPunish = punish => {
  if (punish.length === 0) return
  const canditates = [...new Array(10)].map(_ => 1)
  const selected = Math.floor(Math.random() * canditates.length)
  const inserted = [...new Array(punish.length)].map(() => {
    return [...new Array(10)].map((_i, k) => {
      if (k === selected) return 0
      return 1
    })
  })
  gameGrid = gameGrid.concat(inserted)
  gameGrid = gameGrid.slice(-20)
}
const getPunishColor = punish => {
  const now = new Date().getTime()
  const ttl = Math.round(punish.expiration - now)
  if (ttl < 5000) return '#900C3F'
  if (ttl < 10000) return '#C70039'
  return '#FF5733'
}
const drawPunish = () => {
  const punishSquareSize = 15.7
  const punishSize = {
    width: punishSquareSize + 2,
    height: punishSquareSize * 10 + 11
  }
  const left = squareSize * 10 + 20
  const top = height - punishSize.height - 10
  ctx.fillStyle = '#cccccc'
  ctx.fillRect(
    left,
    top,
    punishSize.width,
    punishSize.height
  )
  const expired = punishment.filter(punish => punish.expiration < new Date().getTime())
  applyPunish(expired)
  punishment = punishment.filter(punish => punish.expiration > new Date().getTime())
  punishment.forEach((punish, key) => {
    ctx.fillStyle = getPunishColor(punish)
    ctx.fillRect(
      left + 1,
      height - 11 - punishSquareSize - (punishSquareSize + 1) * key,
      punishSquareSize,
      punishSquareSize
    )
  })
}

/* gameloop */
const gameloop = () => {
  ctx.clearRect(0, 0, width, height) // clear
  ctx.fillStyle = '#220022'
  ctx.fillRect(0, 0, width, height) // background

  ctx.fillStyle = '#ffffff'
  ctx.font = `30px 'Press Start 2P', cursive`
  ctx.fillText('CANVASTRIS', 50, 60)

  drawGrid()
  drawRemoteGrid()
  drawPunish()
  drawFaller()
  drawNextFaller()
  drawNextFaller(savedFaller, 10, zeroes.y + 100)
  acumScore()
  printLevel()

  gameLoopInteval = setTimeout(() => {
    clearTimeout(gameLoopInteval)
    gameloop()
  }, 33)
}

let gravityTimer
const gravity = () => {
  moveDown()
  gravityTimer = setTimeout(() => {
    clearTimeout(gravityTimer)
    gravity()
  }, 1000 - gameLevel * 10)
}

const canMove = (direction, faller = fallers[0]) => {
  if (!faller) return
  const { shape } = faller.piece
  let canPass = true
  shape.forEach((row, offsetY) => {
    row.forEach((cell, offsetX) => {
      if (!cell) return
      const realPosition = {
        x: faller.position.x + offsetX,
        y: faller.position.y + offsetY
      }
      if (direction === 'down') {
        if (gameGrid[realPosition.y + 1] === undefined) {
          canPass = false
          return
        }
        if (gameGrid[realPosition.y + 1][realPosition.x] === 1) {
          canPass = false
          return
        }
      }
      if (direction === 'left') {
        const nextPosition = gameGrid[realPosition.y][realPosition.x - 1]
        if (nextPosition === 1 || nextPosition === undefined) {
          canPass = false
        }
      }
      if (direction === 'right') {
        const nextPosition = gameGrid[realPosition.y][realPosition.x + 1]
        if (nextPosition === 1 || nextPosition === undefined) {
          canPass = false
        }
      }
    })
  })
  return canPass
}

const permaBlocks = faller => {
  window.playSfx(window.sfx.poof())
  const { shape } = faller.piece
  shape.forEach((row, offsetY) => {
    row.forEach((cell, offsetX) => {
      if (!cell) return
      const realPosition = {
        x: faller.position.x + offsetX,
        y: faller.position.y + offsetY
      }
      gameGrid[realPosition.y][realPosition.x] = 1
    })
  })
}

const acumScore = () => {
  ctx.fillStyle = '#220022'
  ctx.fillRect(322, zeroes.y + 100, 76, 50)
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px Arial'
  ctx.fillText('SCORE', 330, zeroes.y + 112)
  ctx.font = '20px Arial'
  ctx.fillStyle = '#ffffff'
  const cleaned = gameGrid.filter(row => {
    return row.reduce((prev, current) => prev + current) !== fieldSize.x
  })

  const completedLines = gameGrid.length - cleaned.length

  score += scoreTable[completedLines]
  gameLevel = Math.max(score / 10000, 1)
  ctx.fillText(score, 330, zeroes.y + 132)

  if (conn) conn.send({ type: 'updateGrid', data: gameGrid })
  if (completedLines === 0) return
  if (conn) conn.send({ type: 'updateGrid', data: gameGrid })
  if (conn) conn.send({ type: 'punish', data: completedLines })
  punishment = punishment.filter((_, k) => k > completedLines)
  window.playSfx(window.sfx.completedLines(100, completedLines))
  const needed = [...new Array(completedLines)].map(() => {
    return [...new Array(10)].map(() => 0)
  })

  needed.forEach(newRow => {
    cleaned.unshift(newRow)
  })

  gameGrid = JSON.parse(JSON.stringify(cleaned))
}

const printLevel = () => {
  ctx.fillStyle = '#ffffff'
  ctx.font = '12px Arial'
  ctx.fillText(`LEVEL: ${gameLevel}`, 330, zeroes.y + 147)
  ctx.font = '20px Arial'
}

/* movements */
const moveRight = () => {
  const proceed = canMove('right')
  if (!proceed) return
  fallers[0].position.x += 1
}
const instaDown = (faller = fallers[0]) => {
  if (!faller) return
  const ghost = JSON.parse(JSON.stringify(faller))
  const proceed = canMove('down', ghost)
  if (proceed) {
    ghost.position.y += 1
    instaDown(ghost)
    return
  }
  fallers[0] = ghost
  moveDown()
}
const moveDown = () => {
  const proceed = canMove('down')
  if (!proceed) {
    permaBlocks(fallers.shift())
    fallers.push(new Faller())
    return
  }
  fallers[0].position.y += 1
}
const moveLeft = () => {
  const proceed = canMove('left')
  if (!proceed) return
  fallers[0].position.x -= 1
}

const counterClock = () => { fallers[0].rotation = (fallers[0].rotation - 1) % 4 }
const clock = () => { fallers[0].rotation = (fallers[0].rotation + 1) % 4 }
/* capture keys */
const dispatcher = {
  '39': () => {
    if (isPaused) return
    moveRight()
  },
  '40': () => {
    if (isPaused) return
    moveDown()
  },
  '37': () => {
    if (isPaused) return
    moveLeft()
  },
  '38': () => {
    if (isPaused) return
    instaDown()
  },
  '16': () => {
    if (isPaused) return
    counterClock()
  },
  '17': () => {
    if (isPaused) return
    clock()
  },
  '77': () => {
    window.toggleSong('tetrisSong', true)
  },
  '80': () => {
    if (isPaused) {
      gravity()
      isPaused = false
    } else {
      clearTimeout(gravityTimer)
      isPaused = true
    }
  },
  '83': saveFaller
}
document.onkeydown = e => {
  if (!dispatcher[e.keyCode]) return
  dispatcher[e.keyCode]()
}
reset()
