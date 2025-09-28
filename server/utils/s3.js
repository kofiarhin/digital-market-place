const { S3Client, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");

const getS3Client = () => {
  if (!process.env.AWS_REGION || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error("Missing AWS credentials environment variables");
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
  });
};

const createSignedDownloadUrl = async (key) => {
  if (!process.env.AWS_BUCKET) {
    throw new Error("Missing AWS_BUCKET environment variable");
  }

  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET,
    Key: key
  });

  return getSignedUrl(client, command, { expiresIn: 900 });
};

module.exports = {
  createSignedDownloadUrl
};
