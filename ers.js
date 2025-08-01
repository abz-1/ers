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
    let id = req.params.id, type = req.params.type

    try {
        let last = await equipment[type + '-' + id].last
        console.log('%s : %s', last.id, last.date)

        if(last.data.weight > 0) {
            let today = new Date()
            let difference = parseInt(Math.abs(last.date.getTime() - today.getTime()) / (1000 * 60) % 60)
            if(difference > 1) {
                console.log('Дата последнего взвешивания больше минуты, сброс веса в ноль.')
                last.data.weight = 0
                last.data.stable = true
            }
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
    setInterval(checkEquipmentState, 5000)
})

async function startDataCllection() {
    let store = new Store(config.get('store'))

    try {
        let skd = await store.struct()
        skd.forEach((item) => {
            if(item.hasOwnProperty('equipment')) {
                item.equipment.forEach((eq) => {
                    let object = createEquipmentObject(eq)

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

function checkEquipmentState() {
    for (key in equipment) {
        item = equipment[key]
        if(item.state === 'error') {
            let options = {
                id: item.id,
                type: item.type,
                module: item.module,
                direction: item.direction,
                description: item.description,
                driver: item.driver,
                server: item.server,
                port: item.port,
                pinouts: item.pinouts
            }

            console.error('%s:%s\\ state \'error\' reload object.', options.id, new Date())
            let object = createEquipmentObject(options)

            if(object != undefined) {
                equipment[key] = object
            }
        }
    }
}

function createEquipmentObject(options) {
    let object = undefined
    switch(options.type) {
        case 'reader': 
            object = new Reader(options) 
            console.log('Loading reader %s', object.id)
            break
        case 'scale': 
            object = createScale(options)
            console.log('Loading scale %s', object.id)
            break
        case 'camera': 
            object = new Camera(options)
            console.log('Loading camera %s', object.id)
            break
    }

    return object
}