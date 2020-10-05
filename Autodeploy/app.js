const express = require('express');
const app = express();
const port = 3005;
var childProcess = require('child_process');
var githubUsername = 'shahaashay21'

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
    var branch = req.body.ref;

    if(branch.indexOf('master') > -1 && sender.login === githubUsername){
        deploy(res);
    }
}

function deploy(res){
    childProcess.exec('cd /usr/src/ && ./deploy.sh', function(err, stdout, stderr){
        if (err) {
            console.error(err);
            return res.send(500);
        }
        res.send(200);
    });
}

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
})