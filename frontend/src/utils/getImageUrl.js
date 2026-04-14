import { API_BASE } from '../services/api';

export const getImageUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;

  const normalized = imagePath.replace(/\\/g, '/').replace(/^\/+/, '');
  const relativePath = normalized.startsWith('uploads/')
    ? normalized
    : `uploads/${normalized}`;

  const base = API_BASE || '';
  return `${base}/${relativePath}`.replace(/([^:]\/)\/+/g, '$1');
};
