let lastPingTime = 0
let timeoutId = null

const PING_INTERVAL = 1000
const MAX_RTT = 200

self.onmessage = (e) => {
  if (e.data === 'ping') {
    self.postMessage('pong')
  } else if (e.data === 'start') {
    startMonitoring()
  } else if (e.data === 'stop') {
    stopMonitoring()
  } else if (e.data === 'pong') {
    const rtt = Date.now() - lastPingTime
    if (rtt > MAX_RTT) {
      self.postMessage({ type: 'DETECTED', rtt })
    }
    timeoutId = setTimeout(sendPing, PING_INTERVAL)
  }
}

function sendPing() {
  lastPingTime = Date.now()
  self.postMessage('ping_main')
}

function startMonitoring() {
  stopMonitoring()
  sendPing()
}

function stopMonitoring() {
  if (timeoutId) clearTimeout(timeoutId)
}
