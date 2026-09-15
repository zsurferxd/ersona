/**
 * Mengompres file gambar di sisi browser sebelum dikirim ke storage.
 * - Mengubah format menjadi WebP modern
 * - Membatasi dimensi maksimum ke 1600px (sangat tajam untuk layar laptop/HP)
 * - Mengurangi ukuran file hingga 80-95% tanpa kehilangan kualitas kasat mata.
 */
export async function compressImage(file, { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}) {
  // Jika bukan gambar (misalnya video), lewati kompresi
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // GIF tidak dikompres agar animasinya tidak rusak
  if (file.type === 'image/gif') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);

    reader.onload = (event) => {
      const img = new window.Image();
      img.src = event.target.result;

      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Skala proporsional
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // fallback ke file asli jika gagal
              return;
            }

            // Buat File object baru berformat .webp
            const fileName = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const compressedFile = new File([blob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            });

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              ratio: Math.round(((file.size - compressedFile.size) / file.size) * 100),
            });
          },
          'image/webp',
          quality
        );
      };

      img.onerror = (err) => reject(err);
    };

    reader.onerror = (err) => reject(err);
  });
}
