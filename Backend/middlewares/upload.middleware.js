import multer from 'multer';

const storage = multer.memoryStorage();

const allowedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]);

const fileFilter = (req, file, cb) => {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error(
      'Only JPEG, PNG, WebP, and GIF images are allowed.'
    );

    error.statusCode = 415;
    return cb(error);
  }

  return cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1
  }
});


