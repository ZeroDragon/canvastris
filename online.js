/* globals Peer */
const peer = new Peer()

let conn
const connect = (remoteID = document.querySelectorAll('#remoteID')[0].value) => {
  if (conn) return
  if (!remoteID === '') return
  conn = peer.connect(remoteID)
  conn.on('open', function () {
    console.log('connected')
    reset()
  })
}

peer.on('open', function (id) {
  const gameID = document.querySelectorAll('#gamerID')[0]
  gameID.innerHTML = id
})

peer.on('connection', function (remoteConn) {
  connect(remoteConn.peer)
  remoteConn.on('data', function (data) {
    if (data.type === 'updateGrid') {
      remoteGrid = JSON.parse(JSON.stringify(data.data))
      return
    }
    if (data.type === 'punish') {
      const toInsert = [...new Array(data.data)].map(_ => ({
        expiration: new Date().getTime() + 15000
      }))
      toInsert.forEach(itm => {
        punishment.push(itm)
      })
    }
  })
})
