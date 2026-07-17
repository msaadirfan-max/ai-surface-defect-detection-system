const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* Multer configuration for handling file uploads via disk storage. 
Saves processed images directly to the 'uploads/' directory with a unique timestamped filename.
Includes file filter validation to enforce 5MB limits and reject non-image file types.
*/

if (!fs.existsSync("uploads")) {
  /* Check if the 'uploads' directory exists, and create it if it doesn't */
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(
      null,
      "uploads/",
    ); /* cb is the callback that is asynchronously called to specify the destination directory for uploaded files. */
  },
  filename: function (req, file, cb) {
    const uniqueName =
      Date.now() +
      "-" +
      Math.floor(Math.random() * 1000000000) +
      path.extname(
        file.originalname,
      ); /* Generate unique filename by using date timestamp, random number, and original file extension */
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  /* Validating Format */
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];

  const isExtensionValid = /\.(jpeg|jpg|png)$/i.test(file.originalname);

  const isMimeTypeValid = allowedTypes.includes(file.mimetype);

  if (isExtensionValid && isMimeTypeValid) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Invalid file type. Only JPEG, PNG, and JPG files are allowed.",
      ),
      false,
    );
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limit file size to 5MB
  },
});

module.exports = upload;
