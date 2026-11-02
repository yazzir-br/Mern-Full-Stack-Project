
import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

export const cloudinaryConfigured = Boolean(
  env.CLOUDINARY_ENABLED &&
  env.CLOUDINARY_CLOUD_NAME?.trim() &&
  env.CLOUDINARY_API_KEY?.trim() &&
  env.CLOUDINARY_API_SECRET?.trim()
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true
  });
}

export async function deleteCloudinaryImage(publicId) {
  if (!publicId || !cloudinaryConfigured) {
    return;
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: 'image',
      invalidate: true
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      console.error('Cloudinary image deletion was unsuccessful:', {
        publicId,
        result: result.result
      });
    }
  } catch (error) {
    console.error('Cloudinary image deletion failed:', {
      message: error.message,
      publicId
    });
  }
}

export default cloudinary;
