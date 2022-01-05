import { StockServer } from './stockServer'

let app = new StockServer().getApp()
export { app }

app.get('/', (req, res) => {
    res.sendFile(__dirname + "/test.html");
  });