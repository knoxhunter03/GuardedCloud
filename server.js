import express from 'express';
import path from "path";
import fileUpload from 'express-fileupload';
import { fileURLToPath } from 'url';
import { dirname } from 'path';


import { S3Client,
    PutObjectCommand,
    CreateBucketCommand,
    DeleteObjectCommand,
    ListObjectsCommand, 
  } from "@aws-sdk/client-s3";
  import fs from "fs";

const app = express();
app.use(fileUpload());
const port = 3000;

// Serve static files from the 'assets' directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use(express.static(path.join(__dirname, 'assets')));

const bucketName = "guarded-cloud";

const s3Client = new S3Client({
    region: "ap-south-1",
    credentials: {
      accessKeyId: "AKIASTBRH7CVAPSU3EGC",
      secretAccessKey: "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",
    },
  });

// Function to Upload an Object in S3
const uploadObject = async (name, data) =>{

    const params ={
    Bucket: bucketName, // The name of the bucket
    Key: name, // The name of the object
    Body: data, // The content of the object
    ACL: "public-read"
    }
  
    const results = await s3Client.send(new PutObjectCommand(params));
    console.log(
      "Successfully created " +
        params.Key +
        " and uploaded it to " +
        params.Bucket +
        "/" +
        params.Key
    );
  }

  // Function to list all the files
  const listObject = async () => {
    const results = await s3Client.send(
        new ListObjectsCommand({
            Bucket: bucketName,
            ACL: 'public-read',
        })
    );

    if (results.Contents) {
        let links = [];
        for (let item of results.Contents) {
            links.push('https://guarded-cloud.s3.ap-south-1.amazonaws.com/' + item.Key);
        }
        return links;
    } else {
        console.log('No objects found in the bucket.');
        return [];
    }
};

  
  
// Express JS Server
app.get('/', (req, res) => {
  res.sendFile('index.html', { root: path.join("./") });
});

app.get('/index.html', (req, res) => {
  res.sendFile('index.html', { root: path.join("./") });
});

app.get('/files', async (req, res) => {
    let links = await listObject();
    res.json({"file": links})
  });

app.post('/upload', (req, res) => {
    // console.log(req.files.file);
    uploadObject(req.files.file.name, req.files.file.data);
    res.send("Successfully uploaded the file!");
  });

app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}`);
});
