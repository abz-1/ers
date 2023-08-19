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

    _message(m, type = 'log') {
        switch(type) {
            case 'error': console.error('%s : %s\n%s', this.id, new Date(), m); break;
            default: console.log('%s:%s\\ %s', this.id, new Date(), m);
        }
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
        this._reconnect()
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
        this.on('close', this._reconnect)
        this.on('end', this._reconnect)
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
