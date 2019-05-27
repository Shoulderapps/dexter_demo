var http = require('http'); 
var url = require('url'); //url parsing
var fs = require('fs'); //file system
var net = require('net'); //network
const ws = require('ws'); //websocket
// https://github.com/websockets/ws 
//install with:
//npm install --save ws 
//on Dexter, if httpd.js is going to be in the /srv/samba/share/ folder, 
//install ws there but then run it from root. e.g. 
//cd /srv/samba/share/ 
//npm install --save ws 
//cd /
//node /srv/samba/share/httpd.js 

//standard web server on port 80 to serve files
http.createServer(function (req, res) {
  var q = url.parse(req.url, true)
  if ("/"==q.pathname) 
    q.pathname="index.html"
  var filename = "/srv/samba/share/www/" + q.pathname
  console.log("serving"+q.pathname)
  fs.readFile(filename, function(err, data) {
    if (err) {
      res.writeHead(404, {'Content-Type': 'text/html'})
      return res.end("404 Not Found")
    }  
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.write(data)
    return res.end()
  });
}).listen(80)
console.log("listing on port 80")

//socket server to accept websockets from the browser on port 3000
//and forward them out to DexRun as a raw socket
var browser = new ws.Server({ port:3000 })
var bs 
var dexter = new net.Socket()
//don't open the socket yet, because Dexter only allows 1 socket connection
dexter.connected = false //track socket status (doesn't ws do this?)

browser.on('connection', function connection(socket, req) {
    console.log(process.hrtime()[1], " browser connected ", req.connection.Server);
    bs = socket
    socket.on('message', function (data) {
        console.log(process.hrtime()[1], " browser says ", data.toString());

        if (data.toString() == "moveLeft"){
            console.log(process.hrtime()[1], " dexter has to move to left ")
        }
        else if (data.toString() == "moveUp"){
            console.log(process.hrtime()[1], " dexter has to move up ")
        }
        else if (data.toString() == "moveRight"){
            console.log(process.hrtime()[1], " dexter has to move to right ")
        }
        else if (data.toString() == "moveDown"){
            console.log(process.hrtime()[1], " dexter has to move down ")
        } 
        else if (data.toString() == "moveIn"){
            console.log(process.hrtime()[1], " dexter has to move in ")
        }
        else if (data.toString() == "moveOut"){
            console.log(process.hrtime()[1], " dexter has to move out ")
        }
        else if (data.toString() == "home"){
            console.log(process.hrtime()[1], " dexter has to move to home ")
        } 
        //Now as a client, open a raw socket to DexRun on localhost
        if (!dexter.connected) { 
            dexter.connect(50000, "127.0.0.1") 
            console.log(process.hrtime()[1], "dexter connect")
            dexter.on("connect", function () { 
                dexter.connected = true 
                console.log(process.hrtime()[1], "dexter connected")
                } )
            dexter.on("data", function (data){
                console.log(process.hrtime()[1], " dexter says ", data)
                if (bs) {
                    bs.send(data,{ binary: true })
                    console.log(process.hrtime()[1], " browser responded to ")
                    }
                })
            dexter.on("close", function () { 
                dexter.connected = false 
                console.log(process.hrtime()[1], "dexter disconnect")
                dexter.removeAllListeners() 
                //or multiple connect/data/close events next time
                } )
	    dexter.on("error", function () {
                dexter.connected = false 
		console.log("dexter error")
                if (bs) { bs.send(null,{ binary: true }) }
                dexter.removeAllListeners() 
		} )
            }
        dexter.write(data.toString());
        });
    socket.on('close', function (data) {
        console.log(process.hrtime()[1], " browser disconnected ");
        bs = null
        dexter.end()
        });
    });


//test to see if we can get a status update from DexRun
//dexter.write("1 1 1 undefined g ;")

