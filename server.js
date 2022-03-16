const express = require('express');
const cors = require ('cors');
//Note: node-fetch is only available with import... so this is a workaround
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const app = express();


/*Note: When using modules, if you get ReferenceError: require is not defined, 
you'll need to use the import syntax instead of require. 
You can't natively mix and match between them, 
so you'll need to pick one or use a bundler if you need to use both.
*/

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

app.post("/textfortranslation", (req, resp) => {

    const textFromImage = req.body.textFromImage;

    console.log("This is the text from the Image", textFromImage);

    var textFromDeepL;

    async function fetchTranslationInfo() {
        try{
        const response = await fetch('https://api-free.deepl.com/v2/translate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Accept': '*/*'
            },
            body: new URLSearchParams({
                target_lang: 'EN',
                auth_key: 'ddec143e-2630-2a52-13fc-191f9cd1a070:fx',
                text: textFromImage
            })
        })
        textFromDeepL = await response.json();
        console.log(textFromDeepL);

        resp.json(textFromDeepL);

        } catch(error){
            resp.status(400).json(`problem with the API`);
            console.log(error);
        }
    }
    fetchTranslationInfo()
})
