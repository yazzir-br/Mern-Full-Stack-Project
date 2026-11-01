router.post(
  '/profile-picture',
  protect,
  profileImageUpload,
  async (req, res, next) => {
    let newPublicId = null;

    try {
      // Check Cloudinary configuration
      if (!cloudinaryConfigured) {
        return res.status(503).json({
          error: 'Image upload service is not configured'
        });
      }

      // Check uploaded file
      if (!req.file) {
        return res.status(400).json({
          error: 'Please upload an image file'
        });
      }

      // Check image size
      if (req.file.size > 2 * 1024 * 1024) {
        return res.status(413).json({
          error: 'Image must not exceed 2 MB'
        });
      }

      // Verify image buffer
      if (!req.file.buffer || !req.file.buffer.length) {
        return res.status(400).json({
          error: 'Uploaded image is empty or invalid'
        });
      }

      // Verify actual image type
      const verifiedType = getVerifiedImageType(req.file.buffer);

      if (!verifiedType || verifiedType !== req.file.mimetype) {
        return res.status(415).json({
          error: 'Invalid image content or file type'
        });
      }

      // Find authenticated user
      const existingUser = await User.findById(req.user.id)
        .select('profilePicture profilePicturePublicId');

      if (!existingUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }

      // Upload image to Cloudinary
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

              if (!uploadResult?.secure_url || !uploadResult?.public_id) {
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
        // Log actual Cloudinary error without exposing secrets
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

      // Update user profile in database
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

      // Check updated user
      if (!updatedUser) {
        await deleteCloudinaryImage(newPublicId);
        newPublicId = null;

        return res.status(404).json({
          error: 'User not found. Existing profile picture was preserved.'
        });
      }

      // Delete previous image only after successful database update
      const oldPublicId = existingUser.profilePicturePublicId;

      if (oldPublicId && oldPublicId !== newPublicId) {
        await deleteCloudinaryImage(oldPublicId);
      }

      // Upload successful
      return res.status(200).json({
        message: 'Upload successful',
        url: updatedUser.profilePicture
      });

    } catch (error) {
      // Cleanup newly uploaded image if necessary
      if (newPublicId) {
        await deleteCloudinaryImage(newPublicId);
      }

      return next(error);
    }
  }
);

export default router;
