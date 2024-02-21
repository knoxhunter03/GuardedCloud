import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import crypto from "crypto";

const bucketName = "secured-bucket-99";

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIASTBRH7CVAPSU3EGC",
    secretAccessKey: "kiaTxQZHw3e8lbmv8k8pzZKPP0QM8Vj6SNHqtWos",
  },
});

const params = {
  Bucket: bucketName,
  Key: "Dheeraj.txt",
  FilePath: "Dheeraj.txt", // Path to the file on your local machine
  ACL: "public-read",
  
};

// Function to encrypt a file using AES-256
const encryptFile = (filePath, encryptionKey) => {
  const input = fs.createReadStream(filePath);
  const output = fs.createWriteStream(filePath + ".enc");

  const cipher = crypto.createCipher("aes-256-cbc", encryptionKey);
  input.pipe(cipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => resolve(filePath + ".enc"));
    cipher.on("error", reject);
  });
};

// Function to decrypt a file using AES-256
const decryptFile = (encryptedFilePath, decryptionKey) => {
  const input = fs.createReadStream(encryptedFilePath);
  const output = fs.createWriteStream(encryptedFilePath.replace(".enc", ".dec"));

  const decipher = crypto.createDecipher("aes-256-cbc", decryptionKey);
  input.pipe(decipher).pipe(output);

  return new Promise((resolve, reject) => {
    output.on("finish", () => resolve(encryptedFilePath.replace(".enc", ".dec")));
    decipher.on("error", reject);
  });
};

// Function to upload an encrypted file to AWS S3
const uploadEncryptedFile = async (params, encryptedFilePath) => {
  const fileStream = fs.createReadStream(encryptedFilePath);
  params.Body = fileStream;

  const results = await s3Client.send(new PutObjectCommand(params));

  console.log(
    "Successfully created " +
      params.Key +
      " and uploaded the encrypted file to " +
      params.Bucket +
      "/" +
      params.Key
  );
};

// Function to download and decrypt a file from AWS S3
const downloadAndDecryptFile = async (params, decryptionKey) => {
  const encryptedFilePath = params.FilePath + ".enc";
  const decryptedFilePath = await decryptFile(encryptedFilePath, decryptionKey);

  params.Key = params.Key.replace(".enc", ".dec");

  const { Body } = await s3Client.send(new GetObjectCommand(params));
  fs.writeFileSync(decryptedFilePath, Body);

  console.log(
    "Successfully downloaded and decrypted " +
      params.Key +
      " from " +
      params.Bucket +
      "/" +
      params.Key
  );

  return decryptedFilePath;
};

// Function to list all files from AWS S3
const listObject = async (params) => {
  const results = await s3Client.send(new ListObjectsCommand(params));

  for (let item of results.Contents) {
    console.log("https://secured-bucket-99.s3.ap-south-1.amazonaws.com/" + item.Key);
  }
};

// Upload an encrypted file to AWS S3, then download and decrypt it
const run = async () => {
  try {
    const encryptionKey = "key";
    const decryptionKey = "key";

    // Encrypt the file and upload it
    const encryptedFilePath = await encryptFile(params.FilePath, encryptionKey);
    await uploadEncryptedFile(params, encryptedFilePath);

    // List the files in S3
    await listObject(params);

    // Download and decrypt the file
    await downloadAndDecryptFile(params, decryptionKey);
  } catch (err) {
    console.error("Error", err);
  }
};

run();