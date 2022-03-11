const express = require('express');
const cors = require ('cors');
const app = express();

app.use(cors());
//Should use express.json() instead of the old way bodyParser, express already has this built in!
app.use(express.json());

app.listen(3000, ()=> {
    console.log('app is running on port 3000')
})
//test
app.post('/hello', (req, resp) => {
    resp.send('Hello');
})

//actual image post and resp - for image to text
app.post('/image', (req, resp) => {
// Imports the Google Cloud client library

    const link = req.body.link;

    console.log("Link is linkl from front end", link);

    console.log("Req body is", req.body);

    const vision = require('@google-cloud/vision');
    const res = require('express/lib/response');

    async function setEndpoint() {
        // Specifies the location of the api endpoint
        const clientOptions = {apiEndpoint: 'eu-vision.googleapis.com'};

        // Creates a client
        const client = new vision.ImageAnnotatorClient(clientOptions);

        // Performs text detection on the image file
        try{
            const [result] = await client.textDetection(`${link}`);
            const labels = result.textAnnotations;
            console.log('Text:');
            labels.forEach(label => console.log(label.description));
            console.log(labels);
            resp.json(labels);
        } catch(error) {
            resp.status(400).json(`problem with the API`);
            console.log(error);
        }
    }
    setEndpoint();
})
