import { StockServer } from './stockServer'
import * as cors from 'cors'

let app = new StockServer().getApp()
app.use(cors());
export { app }

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/test.html");
  });