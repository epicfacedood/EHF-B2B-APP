import multer from "multer";

// Configure storage options for Multer
const storage = multer.diskStorage({
  // Set the filename for the uploaded file
  filename: function (req, file, callback) {
    callback(null, file.originalname); // Use the original name of the file
  },
});

// Create an instance of Multer with the specified storage options
const upload = multer({ storage });

export default upload;
