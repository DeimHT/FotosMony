// lib/cloudinary.ts
export const getWatermarkedUrl = (publicId: string) => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  // w_1000: ancho, q_auto: calidad optimizada, l_logo: overlay con el ID de tu logo/watermark
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_1000,q_auto,f_auto,l_watermark_logo/v1/${publicId}`;
};