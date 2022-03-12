const Equipment = require('./equipment')

class IND310 extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
        } finally {}

        let event = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: weight,
                stable: stable
            }
        }

        this.emit('weight', event)
    }
}

class TC17P extends Equipment {
    constructor(options) {
        super(options)
        this._connect()

        this._interval = setInterval(this._nextValueCommand, 500)
    }

    _nextValueCommand() {
        this.request(Buffer.from([0xFF, 0x00, 0x10, 0x8F, 0xFF, 0xFF]))
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.toString()
            stable = (tmp.slice(-1) === '"') ? true : false
            weight = parseInt(tmp.replace(/\D/g, ''))
        } finally {}

        let event = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: weight,
                stable: stable
            }
        }

        this.emit('weight', event)
    }
}

class HBT1B extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0

        try {
            tmp    = data.toString('ascii').replace(/\D/g, '')
            stable = true
            weight = parseInt(tmp)
        } finally {}

        let event = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: weight,
                stable: stable
            }
        }

        this.emit('weight', event)
    }
}

class HBT9 extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
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

        let event = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: weight,
                stable: stable
            }
        }

        this.emit('weight', event)
    }
}

class NOV extends Equipment {
    constructor(options) {
        super(options)
        this._connect()
        this._buffer = Buffer.from([])
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

        let event = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                weight: weight,
                stable: stable
            }
        }

        this.emit('weight', event)
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
        console.log(error)
    }

    return result
}

module.exports = {
    createScale
}