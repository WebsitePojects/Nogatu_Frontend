import api from '../api';

/**
 * Upload support attachments BROWSER -> Cloudinary directly (server never proxies
 * the bytes; it only signs the request). Returns the attachment metadata array to
 * send with the chat message.
 *
 * @param {File[]} files
 * @param {{ admin?: boolean, onFileProgress?: (index:number, pct:number)=>void }} opts
 * @returns {Promise<Array<{type,url,publicId,width,height,bytes}>>}
 */
export async function uploadSupportFiles(files, { admin = false, onFileProgress } = {}) {
  if (!files || files.length === 0) return [];

  // Sign once — the signature is valid for a window, so all files in this message
  // reuse it (one cheap server round-trip regardless of how many files).
  const signPath = admin ? '/admin/support/uploads/sign' : '/support/uploads/sign';
  const { data: sig } = await api.post(signPath);

  const uploadOne = (file, index) => new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', sig.timestamp);
    fd.append('signature', sig.signature);
    fd.append('folder', sig.folder);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.uploadUrl, true);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onFileProgress) onFileProgress(index, Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const r = JSON.parse(xhr.responseText);
          resolve({
            type: r.resource_type === 'video' ? 'video' : 'image',
            url: r.secure_url,
            publicId: r.public_id,
            width: r.width || null,
            height: r.height || null,
            bytes: r.bytes || null,
          });
        } catch (err) { reject(err); }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });

  // Upload all in parallel (max 6 per message, so this is bounded).
  return Promise.all(files.map((f, i) => uploadOne(f, i)));
}

/**
 * Upload ONE file to Cloudinary (signed). Used for eager upload-on-attach so the
 * thumbnail can show its own progress and discarding can delete it immediately.
 * @returns {Promise<{type,url,publicId,width,height,bytes}>}
 */
export async function uploadSingleSupportFile(file, { admin = false, onProgress } = {}) {
  const signPath = admin ? '/admin/support/uploads/sign' : '/support/uploads/sign';
  const { data: sig } = await api.post(signPath);
  return new Promise((resolve, reject) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', sig.apiKey);
    fd.append('timestamp', sig.timestamp);
    fd.append('signature', sig.signature);
    fd.append('folder', sig.folder);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', sig.uploadUrl, true);
    xhr.upload.onprogress = (e) => { if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const r = JSON.parse(xhr.responseText);
          resolve({ type: r.resource_type === 'video' ? 'video' : 'image', url: r.secure_url, publicId: r.public_id, width: r.width || null, height: r.height || null, bytes: r.bytes || null });
        } catch (err) { reject(err); }
      } else { reject(new Error(`Upload failed (${xhr.status})`)); }
    };
    xhr.onerror = () => reject(new Error('Network error during upload'));
    xhr.send(fd);
  });
}

/** Delete a staged Cloudinary upload (when the user discards it before sending). */
export async function discardSupportUpload(publicId, type, { admin = false } = {}) {
  if (!publicId) return;
  const path = admin ? '/admin/support/uploads/delete' : '/support/uploads/delete';
  try { await api.post(path, { publicId, type }); } catch { /* worker cleans up later */ }
}

/** Client-side validation: <=5 images + <=1 video, size caps. Returns {ok,error}. */
export function validateSupportFiles(files) {
  const IMG_MAX = 5 * 1024 * 1024;
  const VID_MAX = 50 * 1024 * 1024;
  let images = 0;
  let videos = 0;
  for (const f of files) {
    const isVideo = f.type.startsWith('video/');
    const isImage = f.type.startsWith('image/');
    if (!isVideo && !isImage) return { ok: false, error: 'Only images or videos are allowed.' };
    if (isImage && f.size > IMG_MAX) return { ok: false, error: `${f.name} exceeds the 5 MB image limit.` };
    if (isVideo && f.size > VID_MAX) return { ok: false, error: `${f.name} exceeds the 50 MB video limit.` };
    if (isVideo) videos += 1; else images += 1;
  }
  if (images > 5) return { ok: false, error: 'Up to 5 images per message.' };
  if (videos > 1) return { ok: false, error: 'Up to 1 video per message.' };
  return { ok: true };
}
