var puppeteer = require('puppeteer'),
    path = require('path'),
    fs = require('fs'),
    winston = require('winston'),
    logger = winston.createLogger({
        level:'info',
        format:winston.format.json(),
        transports: [
            new winston.transports.File({filename: 'error.log', level: 'error'}),
            new winston.transports.File({filename: 'all.log'})
        ]
    })

const REDUX_DEVTOOL_LOCATION = path.join(__dirname,'./build/extension/')
const SITE_LOCATION = 'http://localhost:3000'
const FILE_NAME = 'tester.txt'
const FOLDER_NAME = 'old'
const constOfShame = 1000*5

var pageHistory = {}
var pageQueue = []

var puppeteer_options = {
    headless: false,
    args: [
        `--disable-extensions-except=${REDUX_DEVTOOL_LOCATION}`,
        `--load-extension=${REDUX_DEVTOOL_LOCATION}`
    ]
}

puppeteer.launch(puppeteer_options).then(async browser =>{
    const page = await browser.newPage()
    await page.goto(SITE_LOCATION,{
        timeout: 1000 * 60
    })

    pageQueue.push(SITE_LOCATION)
    gotoLinks(page).then(() => {
    setInterval(()=>{
        if(pageQueue.length == 0){
            if(fs.exists(FILE_NAME)){
                if(!fs.exists(FOLDER_NAME)){
                    fs.mkdir(FOLDER_NAME)
                }
                fs.rename(FILE_NAME, `./${FOLDER_NAME}/${fs.statSync(FILE_NAME)}`)
            }
            console.log(pageHistory)
            var file = fs.createWriteStream(FILE_NAME)
            file.on('error', (err) =>{
                if (err) logger.error('File write error when writing history' + err)
            })
            Object.keys(pageHistory).forEach(function(v) { file.write(v + '\n')})
            file.end()
            clearInterval()
        }},constOfShame)
    })
})

async function gotoLinks(page){
    var URL = pageQueue.shift()
    pageHistory[URL] = true;
    logger.info(`searching ${URL}`)
    
    await page.goto(URL)
    
    var arrayOfThingsOnThisPage = await page.$$eval('a', el => el.map(el => el.href))
    pageQueue = pageQueue.concat(arrayOfThingsOnThisPage)
    
    var runQueue = true;
    while(pageQueue.length > 0 && runQueue){
        if(pageHistory[pageQueue[0]]){
            pageQueue.shift()
        }else{
            runQueue = false
        }
    }
    if(pageQueue.length > 0) gotoLinks(page)
    return 
}