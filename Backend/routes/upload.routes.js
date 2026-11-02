
import express from 'express';
import { Readable } from 'node:stream';

import User from '../models/User.js';
import { protect } from '../middlewares/auth.middleware.js';
import { upload } from '../middlewares/upload.middleware.js';

import cloudinary, {
  cloudinaryConfigured,
  deleteCloudinaryImage
} from '../config/cloudinary.js';

const router = express.Router();

const profileImageUpload = upload.single('image');

// Verify the actual image format using its file signature.
function getVerifiedImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // JPEG
  if (
    buffer[0] === 0xff &&
    buffer[1] === 0xd8 &&
    buffer[2] === 0xff
  ) {
    return 'image/jpeg';
  }

  // PNG
  if (
    buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    )
  ) {
    return 'image/png';
  }

  // GIF
  const gifSignature = buffer.toString('ascii', 0, 6);

  if (gifSignature === 'GIF87a' || gifSignature === 'GIF89a') {
    return 'image/gif';
  }

  // WebP
  if (
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return 'image/webp';
  }

  return null;
}

router.post(
  '/profile-picture',
  protect,
  profileImageUpload,
  async (req, res, next) => {
    let newPublicId = null;

    try {
      if (!cloudinaryConfigured) {
        return res.status(503).json({
          error: 'Image upload service is not configured'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload an image file'
        });
      }

      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Image must not exceed 2 MB'
        });
      }

      if (!req.file.buffer || !req.file.buffer.length) {
        return res.status(400).json({
          error: 'Uploaded image is empty or invalid'
        });
      }

      const verifiedType = getVerifiedImageType(req.file.buffer);

      if (!verifiedType || verifiedType !== req.file.mimetype) {
        return res.status(415).json({
          error: 'Invalid image content or file type'
        });
      }

      const existingUser = await User.findById(req.user.id)
        .select('profilePicture profilePicturePublicId');

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      let result;

      try {
        result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              folder: 'profile-pictures',
              resource_type: 'image',
              allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif']
            },
            (error, uploadResult) => {
              if (error) {
                return reject(error);
              }

              if (
                !uploadResult?.secure_url ||
                !uploadResult?.public_id
              ) {
                return reject(
                  new Error('Incomplete Cloudinary upload result')
                );
              }

              resolve(uploadResult);
            }
          );

          stream.on('error', reject);

          Readable.from(req.file.buffer).pipe(stream);
        });
      } catch (error) {
        console.error('Cloudinary upload failed:', {
          message: error.message,
          name: error.name,
          http_code: error.http_code,
          code: error.code
        });

        return res.status(502).json({
          error: 'Cloudinary could not upload the image. Your existing picture should remain unchanged.'
        });
      }

      newPublicId = result.public_id;

      let updatedUser;

      try {
        updatedUser = await User.findByIdAndUpdate(
          req.user.id,
          {
            $set: {
              profilePicture: result.secure_url,
              profilePicturePublicId: result.public_id
            }
          },
          {
            new: true,
            runValidators: true
          }
        ).select('_id profilePicture profilePicturePublicId');
      } catch (error) {
        await deleteCloudinaryImage(newPublicId);
        newPublicId = null;

        return next(error);
      }

      if (!updatedUser) {
        await deleteCloudinaryImage(newPublicId);
        newPublicId = null;

        return res.status(404).json({
          error: 'User not found. Existing profile picture was preserved.'
        });
      }

      const oldPublicId = existingUser.profilePicturePublicId;

      // Delete the old image only after database update succeeds.
      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteCloudinaryImage(oldPublicId);
      }

      return res.status(200).json({
        message: 'Upload successful',
        url: updatedUser.profilePicture
      });

    } catch (error) {
      if (newPublicId) {
        await deleteCloudinaryImage(newPublicId);
      }

      return next(error);
    }
  }
);

export default router;
