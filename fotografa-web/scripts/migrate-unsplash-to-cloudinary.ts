/**
 * Script para migrar imágenes de Unsplash a Cloudinary
 * Esto elimina el consumo de ancho de banda de Vercel por estas imágenes
 * 
 * Uso:
 * 1. npm install node-fetch
 * 2. npx tsx scripts/migrate-unsplash-to-cloudinary.ts
 */

import cloudinary from '../lib/cloudinary';

const UNSPLASH_IMAGES = [
  {
    name: 'hero-principal',
    url: 'https://images.unsplash.com/photo-1718147155878-e2baab858e74?w=900&h=1100&fit=crop&q=80',
    folder: 'static-assets'
  },
  {
    name: 'lagos-landscape',
    url: 'https://images.unsplash.com/photo-1493724798364-c4ca5e3f5fd3?w=1200&h=800&fit=crop&q=80',
    folder: 'static-assets'
  }
];

async function migrateImages() {
  console.log('🚀 Iniciando migración de imágenes de Unsplash a Cloudinary...\n');

  for (const img of UNSPLASH_IMAGES) {
    try {
      console.log(`📥 Subiendo: ${img.name}...`);
      
      const result = await cloudinary.uploader.upload(img.url, {
        public_id: img.name,
        folder: img.folder,
        overwrite: false,
        resource_type: 'image',
      });

      console.log(`✅ Subido exitosamente: ${result.public_id}`);
      console.log(`   URL: ${result.secure_url}`);
      console.log(`   Tamaño: ${(result.bytes / 1024).toFixed(2)} KB\n`);
      
    } catch (error: any) {
      if (error.http_code === 400 && error.message.includes('already exists')) {
        console.log(`⚠️  Ya existe: ${img.name} (saltando)\n`);
      } else {
        console.error(`❌ Error subiendo ${img.name}:`, error.message, '\n');
      }
    }
  }

  console.log('✨ Migración completada!');
  console.log('\n📝 Próximo paso: Actualizar las URLs en tu código:');
  console.log('   const IMG_HERO = cldUrl("static-assets/hero-principal", 900);');
  console.log('   const IMG_LAGOS_LANDSCAPE = cldUrl("static-assets/lagos-landscape", 1200);');
}

migrateImages().catch(console.error);
