const Equipment = require('./equipment')

class Scale extends Equipment {
    constructor(options) {
        super(options)

        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            state: 'something wrong',
            data: {
                weight: 0,
                stable: true
            }
        }
        setInterval(this._setState.bind(this), 60000)
    }

    _setState() {
        let now = new Date()
        let difference = parseInt(Math.abs(this.last.date.getTime() - now.getTime()) / (1000 * 60) % 60)
        this.last.state = (difference > 1) ? 'something wrong' : 'ok'
    }
}

class IND310 extends Scale {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            tmp    = data.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
            this.last.date = date
        } finally {}

        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class IND780 extends Scale {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            tmp    = data.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
            this.last.date = date
        } finally {}

        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}


class TC17P extends Scale {
    constructor(options) {
        super(options)
        this._connect()
        this._nextValueCommand()
        setInterval(this._nextValueCommand.bind(this), 1000)
    }

    _nextValueCommand() {
        this.request(Buffer.from([0x10]))
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            tmp    = data.toString()
            stable = (tmp.slice(-1) === '"') ? true : false
            weight = parseInt(tmp.replace(/\D/g, ''))
            this.last.date = date
        } finally {}

        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class HBT1B extends Scale {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            tmp    = data.toString('ascii').replace(/\D/g, '')
            stable = true
            weight = parseInt(tmp)
            this.last.date = date
        } finally {}

        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class HBT9 extends Scale {
    constructor(options) {
        super(options)
        this._connect()
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            tmp = data.toString('ascii').replace(/[\W_]+/g, '')
            if(!tmp.startsWith('wn') && !tmp.endsWith('kg')) 
                return
            stable = tmp.indexOf('wn-') >= 0 ? false : true
            weight = parseInt(tmp.replace('wn', '').replace('kg', ''))
            this.last.date = date
        } finally {}

        this.last.data.weight = weight
        this.last.data.stable = stable

        this.emit('weight', this.last)
    }
}

class NOV extends Scale {
    constructor(options) {
        super(options)
        this._connect()

        this._buffer = Buffer.from([])
    }

    _onData(data) {
        let tmp, stable = false, weight = 0, date = new Date()

        try {
            if(data[0] != 0xd) {
                this._buffer = Buffer.concat([this._buffer, data])
                return
            }

            tmp = this._buffer.slice(1).toString('ascii').replace(/\s\s+/g, ' ').split(' ')
            stable = (parseInt(tmp[0]) === 10) ? true : false
            weight = parseInt(tmp[1])
            this.last.date = date
        } catch(error) {
            return
        }

        this._buffer = Buffer.from([])

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
            case 'IND780': result = new IND780(options); break;
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
