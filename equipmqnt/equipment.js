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
        this.state       = 'ok'
    }

    _message(m, type = 'log') {
        let d_t     = new Date(),
            year    = d_t.getFullYear(),
            month   = (d_t.getMonth() + 1).toString().padStart(2, '0'),
            day     = d_t.getDate().toString().padStart(2, '0'),
            hour    = d_t.getHours().toString().padStart(2, '0'),
            minute  = d_t.getMinutes().toString().padStart(2, '0'),
            seconds = d_t.getSeconds().toString().padStart(2, '0'),
            stump   = `${year}-${month}-${day} ${hour}:${minute}:${seconds}`
        console[type]('%s:%s:%s\\ %s', this.id, this.module, stump, m)
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
        this._message('connected.')
    }

    _onError(e) {
        this._message(e, 'error')
        this.destroy()
        this.state = 'error'
        //this.destroy()
        //this._reconnect()
        /*
        switch(e.code) {
            case 'ENETUNREACH':
            case 'EHOSTUNREACH':
            case 'ETIMEDOUT':
            case 'EADDRNOTAVAIL':
            case 'ERR_SOCKET_CLOSED':
            case 'ECONNREFUSED': this._reconnect(); break;
        }
        */
    }

    _connect() {
        this.connect(this.port, this.server, this._onConnet)
        this.on('error', this._onError)
        //this.on('close', this._reconnect)
        //this.on('end', this._reconnect)
    }

    _reconnect() {
        this._message('reconnecting.')
        this.removeAllListeners()
        //this._connect()
        setTimeout(() => { 
            this._connect()
        }, 10000)
    }
}
