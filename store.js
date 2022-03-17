const http    = require('http')
    , { URL } = require('url')

module.exports = class {
    constructor(options) {
        this._sid = ''
        this._user = options.user
        this._password = options.password
        this._url = options.url
    }

    _buildOptions() {
        let temp = new URL(this._url)
        return {
            hostname: temp.host,
            port: temp.port,
            path: temp.pathname,
            method: 'GET',
            headers: { 
                accept: 'application/json',
                authorization: 'Basic ' + Buffer.from(this._user + ':' + this._password).toString('base64'),
                cookie: this._sid
            }
        }
    }

    async _request(options, data) {
        return new Promise((resolve, reject) => {
            let req = http.request(options, (res) => {
                let body = '';
                if(res.statusCode != 200) {
                    let err = new Error('Request error')
                    return reject(err)
                }

                res.on('data', (chunk) => {
                    body += chunk
                })
            
                res.on('end', () => {
                    resolve(body)
                })
            })

            req.on('error', (error) => {
                reject(error)
            })

            if(options.method == 'POST') req.write(data)

            req.end()
        })
    }

    async struct() {
        let options = this._buildOptions(), result = []

        options.path += 'config'
        try{
            result = JSON.parse(await this._request(options))
        } catch(e) {
            console.log(e)
        }

        return result
    }

    async save(message) {

    }
}