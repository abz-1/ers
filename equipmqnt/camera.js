const { Transform } = require('stream')
    , { URL }       = require('url')
    , http          = require('http')
    , agent         = new http.Agent({ keepAlive: true })

class ImageExtractor extends Transform {
    constructor(options) {
        super(options)

        this._buffer = null
        this._soi    = Buffer.from([0xff, 0xd8])
        this._eoi    = Buffer.from([0xff, 0xd9])
    }

    _transform(chunk, encoding, callback) {
        let start, end, image = null
        while (chunk) {
            if (this._buffer) {
                if (-1 != (end = chunk.indexOf(this._eoi))) {
                    end  += this._eoi.length
                    image = Buffer.concat([this._buffer, chunk.slice(0, end)])
                    this.emit('image', image)

                    chunk        = chunk.slice(end)
                    this._buffer = null
                } else {
                    this._buffer = Buffer.concat([this._buffer, chunk])
                    chunk        = null
                }
            } else {
                chunk = -1 != (start = chunk.indexOf(this._soi)) ? chunk.slice(start) : null
                if (chunk) this._buffer = Buffer.alloc(0)
            }
        }
        callback()
    }

    _flush(callback) {
        this._buffer = null
        callback()
    }
}

class Graber {
    constructor() {}
    static async grab(url) {
        return new Promise((resolve, reject) => {
            let options = new URL(url),
                ie      = new ImageExtractor()

            options.agent = agent
            http.get(options, (res) => {
                res.pipe(ie)
                ie.on('image', (chunk) => {
                    res.destroy()
                    resolve(chunk)
                })
            }).on('error', (error) => {
                reject(error)
            })
        })
    }
}

module.exports = class {
    constructor(options) {
        this.id          = options.id
        this.tpe         = options.type
        this.description = options.description
        this.url         = options.server
        this._last       = {
            id: this.id,
            date: new Date(),
            data: {
                image: '' 
            }
        }
    }

    get last() {
        return (async () => {
            this._last.date = new Date()
            try {
                this._last.data.image = (await Graber.grab(this.url)).toString('base64')
            } catch(error) {
                console.error(error)
                this._last.data.image = ''
            }

            return this._last
        })()
    }

    set last(val) {
        this._last = val
    }
}