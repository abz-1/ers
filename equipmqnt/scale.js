const Equipment = require('./equipment')

class IND310 extends Equipment {
    constructor(options) {
        super(options)
        this._connect()

        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: 0,
                stable: true
            }
        }
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
        } finally {}

        this.last.date = new Date()
        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class TC17P extends Equipment {
    constructor(options) {
        super(options)
        this._connect()

        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: 0,
                stable: true
            }
        }

        this._nextValueCommand()
        setInterval(this._kickMe.bind(this), 5000)
    }

    _kickMe() {
        let diff = Math.abs((new Date().getTime() - this.last.date.getTime()) / 1000)
        if(diff >= 30) {
            console.error(`${this.id}(${this.module}) ${this.server}:${this.port} \\ "застрял" или головное устройство отключено в течении ${(diff / 60).toFixed(2)} минут.`)
            this._nextValueCommand()
        }
    }

    _nextValueCommand() {
        this.request(Buffer.from([0x10]))
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.toString()
            stable = (tmp.slice(-1) === '"') ? true : false
            weight = parseInt(tmp.replace(/\D/g, ''))
        } finally {}

        this.last.date = new Date()
        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
        this._nextValueCommand()
    }
}

class HBT1B extends Equipment {
    constructor(options) {
        super(options)
        this._connect()

        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: 0,
                stable: true
            }
        }
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.toString('ascii').replace(/\D/g, '')
            stable = true
            weight = parseInt(tmp)
        } finally {}

        this.last.date = new Date()
        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class HBT9 extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
        
        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: 0,
                stable: true
            }
        }
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp = data.toString('ascii').replace(/[\W_]+/g, '')
            if(!tmp.startsWith('wn') && !tmp.endsWith('kg')) 
                return
            stable = tmp.indexOf('wn-') >= 0 ? false : true
            weight = parseInt(tmp.replace('wn', '').replace('kg', ''))
        } finally {}

        this.last.date = new Date()
        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class NOV extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
        
        this._buffer = Buffer.from([])
        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: 0,
                stable: true
            }
        }
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            if(data[0] != 0xd) {
                this._buffer = Buffer.concat([this._buffer, data])
                return
            }

            tmp = this._buffer.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
        } catch(error) {
            return
        }

        this._buffer = Buffer.from([])

        this.last.date = new Date()
        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

function createScale(options) {
    let result = undefined

    try {
        switch(options.module) {
            case 'IND310': result = new IND310(options); break;
            case 'HBT9': result = new HBT9(options); break;
            case 'HBT1B': result = new HBT1B(options); break; 
            case 'TC17P': result = new TC17P(options); break;
            case 'NOV': result = new NOV(options); break;
        }
    } catch(error) {
        console.error(error)
    }

    return result
}

module.exports = {
    createScale,
    IND310,
    TC17P,
    HBT1B,
    HBT9,
    NOV
}