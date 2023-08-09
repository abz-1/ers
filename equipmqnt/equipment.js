const net = require('net')

module.exports = class extends net.Socket {
    constructor(options) {
        super()

        this.id          = options.id
        this.type        = options.type
        this.module      = options.module
        this.direction   = options.direction
        this.description = options.description
        this.driver      = options.driver
        this.server      = options.server
        this.port        = options.port
        this.pinouts     = options.pinouts
    }

    request(data) {
        try {
            this.write(data)
        } catch(e) {
            console.error(e)
        }
    }

    _onConnet() {
        this.setKeepAlive(true, 500)
        this.on('data', this._onData)
    }

    _onError(e) {
        console.error(e)
        this.destroy()
        switch(e.code) {
            case 'ENETUNREACH':
            case 'EHOSTUNREACH':
            case 'ETIMEDOUT':
            case 'EADDRNOTAVAIL':
            case 'ERR_SOCKET_CLOSED':
            case 'ECONNREFUSED': this._reconnect(); break;
        }
    }

    _connect() {
        this.connect(this.port, this.server, this._onConnet)
        this.on('error', this._onError)
        this.on('close', this._reconnect)
        this.on('end', this._reconnect)
    }

    _reconnect() {
        console.log('%s reconnecting...', this.id)
        this.removeAllListeners()
        this._connect()
        // setTimeout(() => { 
        //     this._connect()
        // }, 30000)
    }
}
