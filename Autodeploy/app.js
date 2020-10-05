const express = require('express');
const app = express();
var cookieParser = require('cookie-parser');
const port = 3005;
const { spawn } = require('child_process');
var githubUsername = 'shahaashay21'

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Hello World!');
})

app.post("/autodeploy", function (req, res) {
    autodeploy(req, res);
});


app.get("/autodeploy", function (req, res) {
    autodeploy(req, res);
});


function autodeploy(req, res){
    var sender = req.body.sender;
    var branch = req.body.repository.default_branch;

    if(branch.indexOf('master') > -1 && sender.login === githubUsername){
        deploy(res);
    }
}

function deploy(res){
    const child = spawn('/usr/src/deploy.sh', [], {
        detached: true,
        stdio: 'ignore'
    });
    
    child.unref();
    res.send(200);
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})