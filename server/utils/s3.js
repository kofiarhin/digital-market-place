const fs = require("fs");
const path = require("path");

const resolveStorageRoot = () => path.resolve(__dirname, "..", "storage");

const assertWithinStorage = (storageRoot, filePath) => {
  const relativePath = path.relative(storageRoot, filePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new Error("Invalid asset key path");
  }
};

const ensureFileReadable = async (filePath) => {
  await fs.promises.access(filePath, fs.constants.R_OK);
};

const createSignedDownloadUrl = async (key) => {
  if (!key) {
    throw new Error("Missing asset key");
  }

  const storageRoot = resolveStorageRoot();
  await fs.promises.mkdir(storageRoot, { recursive: true });

  const absolutePath = path.resolve(storageRoot, key);

  assertWithinStorage(storageRoot, absolutePath);
  await ensureFileReadable(absolutePath);

  return absolutePath;
};

module.exports = {
  createSignedDownloadUrl
};
