import * as express from 'express'
import { Request, Response, NextFunction } from 'express';
import * as cors from 'cors'
import * as http from 'http'
import * as SocketIO from 'socket.io'
import * as Interfaces from './Interfaces'
import * as request from 'request'



export class StockServer {

    public static readonly PORT: number = 8080 // Default local port
    public static readonly SYMBOLS: string[] = ['AAPL', 'TSLA'];

    public static dummyData:{[symbol:string]:Interfaces.DataPoint[]} = {}
    public static realData:{[symbol:string]:Interfaces.DataPoint[]} = {} // -1
    public static realData5:{[symbol:string]:Interfaces.DataPoint[]} = {} // 5
    public static realData15:{[symbol:string]:Interfaces.DataPoint[]} = {} // timeframe = 15
    public static realData60:{[symbol:string]:Interfaces.DataPoint[]} = {} // timeframe = 60
    public static timeframe:number
    

    private app: express.Application
    private server: http.Server
    private io: SocketIO.Server
    private port: string | number

    private maxmin: {[symbol:string]: {max: number, min: number}} = {}
    private tfArr:string
    
    constructor() {
        this.createApp()
        this.listen()
        this.createDummyData()
        this.getRealData()
    }

    private createDummyData():void{
        StockServer.SYMBOLS.forEach((sym) => {
            StockServer.dummyData[sym] = [];

            const max = Math.random() * (500 - 100) + 100;
            const min = max - 50;

            this.maxmin[sym] = {max: max, min: min};

            const time = Date.now()
            let prevOpen = '', bool = true;
            let open = '';
            for(let i = 0; i<100; i++){
                let arr = [Math.random()*(max - min) + min, Math.random()*(max - min) + min, Math.random()*(max - min) + min];
                arr.sort();
                arr.reverse();
                open = arr[1].toFixed(2);
                StockServer.dummyData[sym].push({
                    timestamp: new Date(time-i*86400000).toString(),
                    open: open,
                    high:  arr[0].toFixed(2) > prevOpen ? arr[0].toFixed(2) : prevOpen,
                    low:  arr[2].toFixed(2) < prevOpen || bool ? arr[2].toFixed(2) : prevOpen,
                    close:  bool ? (Math.random()*(max - min) + min).toFixed(2):prevOpen
                })
                bool = false;
                prevOpen = open;
            }
        })
    }

    private getRealData():void {
        let timeframes = [
            // {'path': 'daily', "array": 'realData'}, 
            {'path': '5/minute', "array": 'realData5'},
            {'path': '15/minute', "array": 'realData15'}, 
            // {'path': '60/minute', "array": 'realData60'}, 
        ]

        timeframes.forEach(tf => {
            StockServer.SYMBOLS.forEach((sym) => {

            StockServer[tf.array][sym] = []
            request.get(`https://nabors-stock-database.herokuapp.com/${sym.toLowerCase()}/${tf.path}`, (error, resp:any, body) => {
                let data = JSON.parse(body)
                
                data.forEach(element => {
                    StockServer[tf.array][sym].push({
                        timestamp: element.date,
                        open: element.open,
                        high: element.high,
                        low: element.low,
                        close: element.close
                    })
                });

                //console.log(tf.array, StockServer[tf.array])
            })
        })
        })
        
    }

    private createApp(): void {
        this.app = express()
        this.app.use(cors())
        this.server = http.createServer(this.app)
        this.port = process.env.PORT || StockServer.PORT
        this.io = require('socket.io')(this.server, { cors: { origins: '*' } })
    }

    private getHistoricalData(obj):Interfaces.Historical {
        console.log(obj)
        StockServer.timeframe = obj.timeframe
        const output:Interfaces.Historical = {
            "response-type": "historical",
            data:[]
        };
        this.tfArr = 'realData'+(StockServer.timeframe === -1 ? '' : StockServer.timeframe)
        obj.symbols.forEach(element => {
            if(!StockServer[this.tfArr][element]){
                output.data.push({
                    symbol:element, 
                    data:[]
                })
            }else{
            output.data.push({
                    symbol:element, 
                    data:StockServer[this.tfArr][element].filter(dp => new Date(dp.timestamp) >= new Date(obj.start))
                })
            }
        });
        console.log("first: ",output.data[0].data[0])
        console.log("last: ",output.data[0].data[output.data[0].data.length-1])
        return output;
    }

    private getLiveData(sym):Interfaces.Live {
        const output:Interfaces.Live = {
            "response-type": "live",
            "new-value":{symbol:sym, data: []}
        };
        if(!StockServer[this.tfArr][sym]){
            //output['new-value'].data.push([])
        }else{
            const lastVals = StockServer[this.tfArr][sym][StockServer[this.tfArr][sym].length - 1];
            console.log(lastVals, sym)
            const rand = (1-(Math.random()*2))/50;
            
            console.log("rand: ",rand)
            const newClose = lastVals.close + (rand)
            
            const newValue = {
                timestamp: new Date('2022-01-13T09:30:00.000Z').toISOString(),
                open: lastVals.close,
                high: newClose > lastVals.high ? newClose : lastVals.high,
                low:  newClose < lastVals.low ? newClose : lastVals.low ,
                close:  newClose
            }
            output['new-value'].data.push(newValue);
            StockServer[this.tfArr][sym][StockServer[this.tfArr][sym].length - 1] = newValue;
            console.log(newValue)
        }
        return output;
    }

    private listen(): void {
        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port)
        })

        this.io.on('connect', (socket: any) => {
            console.log(`New Client Connected. Id: ${socket.id}`)
            let lobby: string = ''

            /* List check */
            socket.on('list', () => socket.emit('list', {
                symbols: StockServer.SYMBOLS,
                'response-type': "list"
            }))

            // Historical
            socket.on('historical', (obj) => socket.emit('historical', this.getHistoricalData(obj)))

            // Live
            socket.on('live', (obj) => {
                obj.symbols.forEach(sym => {
                    socket.emit('live', this.getLiveData(sym))
                });
                setInterval(()=>{
                    obj.symbols.forEach(sym => {
                        socket.emit('live', this.getLiveData(sym))
                    });
                },5000)
            })
        })
    }

    public getApp(): express.Application {
        return this.app
    }
}