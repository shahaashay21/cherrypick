const express = require('express');
const app = express();
const fs = require('fs');
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
    autodeploy(req, res, 1);
});


function autodeploy(req, res, ignore = 0) {
    if (!ignore) {
        var sender = req.body.sender;
        var branch = req.body.repository.default_branch;

        if (ignore || ((branch && branch.indexOf('master') > -1) && sender.login === githubUsername)) {
            deploy(res);
        }
    } else {
        deploy(res);
    }
}

const out = fs.openSync('../deploy.out', 'a');
const err = fs.openSync('../deploy.out', 'a');
function deploy(res) {
    const child = spawn('/srv/cherry-pick/autodeploy.sh', [], {
        detached: true,
        stdio: ['ignore', out, err]
    });

    child.unref();
    res.send(200);
}

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
})