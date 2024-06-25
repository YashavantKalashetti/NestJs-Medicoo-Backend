require('dotenv').config();
const express = require('express');
const router = express.Router();

const Tesseract = require('tesseract.js')
const path = require('path')
const axios = require('axios');
const pdfParse = require('pdf-parse');

const { Client } = require('@elastic/elasticsearch')

const client = new Client({
  node: process.env.ELASTIC_SEARCH_URL,
  auth: {
    apiKey: process.env.ELASTIC_SEARCH_API_KEY
  }
})


async function createIndex() {
    await client.indices.create({
        index: 'medical-reports',
        body: {
            mappings: {
                properties: {
                    patientId: { type: 'keyword' },
                    documentId: { type: 'keyword' },
                    documentText: { type: 'text' },
                    timestamp: { type: 'date' }
                }
            }
        }
    });
}

// async function deleteAllIndexes() {
//     try {
//         const response = await client.indices.delete({ index: '_all' });
//         console.log('All indexes deleted:', response);
//     } catch (error) {
//         console.error('Error deleting indexes:', error);
//     }
// }

async function InsertElasticSerachIndex(databaseId, patientId, documentText){
    try {
        // console.log("Inserting into elastic search")
        const indexExists = await client.indices.exists({ index: 'medical-reports' });

        // Create the index if it does not exist
        if (!indexExists) {
            await createIndex().catch(err => {
                console.error('Error creating index:', err);
                throw new Error('Error creating index');
            });
        }

        // Insert the document into ElasticSearch
        const data = await client.index({
            index: 'medical-reports',
            id: `${databaseId}`,
            document: {
                patientId: `${patientId}`,
                documentId: `${databaseId}`,
                documentText: `${documentText}`,
                timestamp: new Date().toISOString()
            }
        });

        console.log('Document inserted into ElasticSearch.');
        return true;

    } catch (error) {
        console.error('Error inserting document into ElasticSearch:', error.message);
        return false;
    }

}


router.post('/med-reports', async (req, res) => {

    // console.log("received request")

    try {
        let files = [];
    
        const { patientId, searchText } = req.body;
    
        console.log(patientId, searchText)
    
        if(!patientId || !searchText) {
            return res.status(400).send('Patient ID and document text are required.');
        }
    
        await client.indices.refresh({ index: 'medical-reports' });
    
        const data = await client.search({
            index: 'medical-reports',
            size: 20, // Limit to 20 results
            query: {
                bool: {
                    must: [
                        { term: { patientId: `${patientId}` } },
                        { wildcard: { documentText: `*${searchText}*` } }
                    ]
                }
            },
            sort: [
                { timestamp: { order: 'desc' } }
            ]
        });
    
        console.log("Reading all matching documents:");
        data.hits.hits.forEach((hit) => {
            files.push(hit._source);
        });
    
        return res.json({ files });
    } catch (error) {
        console.error('Error searching documents in ElasticSearch:', error.message);
        return res.status(500).send('Error searching documents in ElasticSearch.');
    }

})

router.post('/pdfToText', async (req, res) => {
    const { url, patientId, databaseId } = req.body;

    if (!url) {
        return res.status(400).send('No file link provided.');
    }

    try {
        const response = await axios.get(url, {
            responseType: 'arraybuffer'
        });

        if (!response.data || response.data.length === 0) {
            return res.status(500).send('Empty response received from the file link.');
        }

        const data = await pdfParse(response.data);

        if (!data || !data.text) {
            return res.status(500).send('Error parsing PDF file: No text extracted.');
        }

        if(data?.text?.length >= 30 && databaseId && patientId){
            console.log("Inserting into elastic search")
            console.log(data.text)
            const uploaded = await InsertElasticSerachIndex(databaseId, patientId, data.text)
            if(!uploaded)
                return res.status(500).json({msg:"Error inserting into elastic search"});
            return res.status(200).json({msg:"Text extracted and inserted into elastic search"});
        }
    
        return res.status(400).json({msg:"Text extracted is not long enough to be inserted into elastic search"});

    } catch (error) {
        console.error('Error downloading or parsing PDF file:', error.message);
        return res.status(500).send('Error downloading or parsing PDF file.');
    }
});

router.post('/imageToText', async (req, res) => {
    try {
        const { url, databaseId, patientId} = req.body;

        if (!url) {
            return res.status(400).send('No image path provided.');
        }

        let ext = path.extname(url).toLowerCase();
        if(ext === '.pdf' || ext === '.docx' || ext === '.heic'){
            return res.status(400).send('Unsupported file format');
        }

        let text = '';

        switch (ext) {
            case '.jpg':
            case '.jpeg':
            case '.png':
            case '.gif':
            case '.bmp':
            case '.tiff':
            case '.webp':
            case '.avif':
                const result = await Tesseract.recognize(url, 'eng');
                if (result && result.data && result.data.text) {
                    text = result.data.text;
                } else {
                    throw new Error('Tesseract.js failed to recognize text.');
                }
                break;
            default:
                return res.status(400).send('Unsupported image format.');
        }

        if(text.length >= 30 && databaseId && patientId){
            // console.log(text)
            const uploaded = await InsertElasticSerachIndex(databaseId, patientId, text)
            if(!uploaded)
                return res.status(500).json({msg:"Error inserting into elastic search"});
            return res.status(200).json({msg:"Text extracted and inserted into elastic search"});
        }
    
        return res.status(400).json({msg:"Text extracted is not long enough to be inserted into elastic search"});
        

    } catch (error) {
        console.error(`Error recognizing text from image:`, error.message);
        return res.status(500).send('Error recognizing text from image.');
    }
});

module.exports = router;