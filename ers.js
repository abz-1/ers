const Store           = require('./store')
    , express         = require('express')
    , bodyParser      = require('body-parser')
    , Camera          = require('./equipmqnt/camera')
    , { createScale } = require('./equipmqnt/scale')
    , Reader          = require('./equipmqnt/reader')
    , path            = require('path')
    , config          = require('nconf')

let app = express(), equipment = []

config.argv().env().file({ 
    file: path.join(__dirname, 'settings.json') 
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/events/:type/:id', async (req, res, next) => {
    let id = req.params.id, type = req.params.type, today = new Date()

    try {
        let last = await equipment[type + '-' + id].last
        console.log('%s : %s', last.id, last.date)
        let difference = parseInt(Math.abs(last.date.getTime() - today.getTime()) / (1000 * 60) % 60)
        if(difference > 1) {
            last.data.weight = 0
            last.data.stable = true
        }
        res.send(last)
    } catch(e) {
        res.status(404).end()
        console.error(e)
    }
})

let port = config.get('service:port')
app.listen(port, async () => {
    console.log('Server started on port: %d', port)
    console.log('Starting data collection')
    await startDataCllection()
})

async function startDataCllection() {
    let store = new Store(config.get('store'))

    try {
        let skd = await store.struct()
        skd.forEach((item) => {
            if(item.hasOwnProperty('equipment')) {
                item.equipment.forEach((eq) => {
                    let object = undefined
                    switch(eq.type) {
                        case 'reader': 
                            object = new Reader(eq) 
                            console.log('Loading reader %s', eq.id)
                            break
                        case 'scale': 
                            object = createScale(eq)
                            console.log('Loading scale %s', eq.id)
                            break
                        case 'camera': 
                            object = new Camera(eq)
                            console.log('Loading camera %s', eq.id)
                            break
                    }

                    if(object != undefined) {
                        equipment[eq.type + '-' + eq.id] = object
                    }
                })
            }
        })
    } catch(e) {
        console.error(e)
    }
}