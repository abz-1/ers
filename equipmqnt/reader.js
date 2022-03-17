const Equipment = require('./equipment')

module.exports = class extends Equipment {
    constructor(options) {
        super(options)
        this._connect()

        this.last = {
            id: this.id,
            type: this.type,
            date: new Date(),
            data: {
                card: ''
            }
        }
    }

    _onData(incomming) {
        let card = '', tmp  = incomming.toString('ascii')

        if(tmp.length < 9) return;

        let matches = tmp.match(/[0-9]{3},[0-9]{5,6}/)
        if(matches != null) {
            card = matches[0]
        } else {
            return;
        }

        this.last.date = new Date()
        this.last.data.card = card

        this.emit('card', this.last)
    }
}