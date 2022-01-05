import * as express from 'express'
import * as cors from 'cors'
import * as http from 'http'
import * as SocketIO from 'socket.io'

// import Chat from '../../socket-chat/src/app/Classes/Chat'
// import Message from '../../socket-chat/src/app/Classes/Message'

export class StockServer {

    public static readonly PORT: number = 8080 // Default local port
    public static readonly SYMBOLS: string[] = ['ABC', 'XYZ', 'LMNO'];


    private app: express.Application
    private server: http.Server
    private io: SocketIO.Server
    private port: string | number

    /* Map of Chat instances to their respective lobby names */
    // private chatRooms: Map<string, Chat> = new Map<string, Chat>() // All Game instances stored in a map


    constructor() {
        this.createApp()
        this.config()
        this.createServer()
        this.sockets()
        this.listen()
    }

    private createApp(): void {
        this.app = express()
        this.app.use(cors())
    }

    private createServer(): void {
        this.server = http.createServer(this.app)
    }

    private config(): void {
        this.port = process.env.PORT || StockServer.PORT
    }

    private sockets(): void {
        this.io = require('socket.io')(this.server, { cors: { origins: '*' } })
    }

    private listen(): void {

        this.server.listen(this.port, () => {
            console.log('Running server on port %s', this.port)
        })

        this.io.on('connect', (socket: any) => {
            console.log(`New Client Connected. Id: ${socket.id}`)

            let lobby: string = ''

            /* List check */
            socket.on('list', () => socket.emit('ping', {
                symbols: StockServer.SYMBOLS,
                'response-type': "list"
            }))

            /* Check if lobby exist */
            // socket.on('checklobby', (lobby: string) => socket.emit('checklobby', this.chatRooms.has(lobby) ? true : false))

            /* Create lobby */
            socket.on('create', () => {

                const lobby = Math.random().toString(36).substring(2, 7) // Generates random lobby name

                /* If lobby doesn't exist and we haven't exceeded max chatRooms allowed, create a new lobby/game */
                // if (this.chatRooms.has(lobby) == false && this.chatRooms.size < ChatServer.MAX_ROOMS) {
                //     console.log(`New Lobby '${lobby}' created`)
                //     this.chatRooms.set(lobby, new Chat())
                //     socket.emit('create', lobby)
                // } else socket.emit('create')

            })


            socket.on('isTyping', () => {
                this.io.to(lobby).emit('userTyping', socket.id)
            })

            socket.on('stoppedTyping', () => {
                this.io.to(lobby).emit('userStoppedTyping', socket.id)
            })
            
        })


    }

    public getApp(): express.Application {
        return this.app
    }
}