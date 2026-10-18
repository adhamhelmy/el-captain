import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';
import type { PickedFile } from './upload';

const TYPE_BY_EXT: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', pdf: 'application/pdf', mp4: 'video/mp4', mov: 'video/quicktime', webm: 'video/webm' };
/** The picker's type, or one read from the file name; photos from the library come back as JPEG (see pickImage). */
const typeOf = (name: string, given?: string | null) => given || TYPE_BY_EXT[name.split('.').pop()?.toLowerCase() ?? ''] || 'image/jpeg';

/**
 * One photo from the library. iOS stores many as HEIC, which the uploads don't take: "compatible" mode and editing
 * hand back a JPEG. `aspect` crops it (1:1 for the profile photo). iOS can only crop squares, so a wide cover is taken
 * whole there and the screens crop it when showing it, as the web does.
 */
export async function pickImage(aspect?: [number, number]): Promise<PickedFile | null> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: !!aspect && (Platform.OS === 'android' || aspect[0] === aspect[1]),
    aspect,
    quality: 0.85,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  const a = r.canceled ? null : r.assets[0];
  if (!a) return null;
  const name = a.fileName || `photo-${Date.now()}.jpg`;
  return { uri: a.uri, name, type: typeOf(name, a.mimeType), size: a.fileSize };
}

/** Files (PDFs or images) from Files, for certificates. */
export async function pickDocuments(types: readonly string[]): Promise<PickedFile[]> {
  const r = await DocumentPicker.getDocumentAsync({ type: [...types], multiple: true, copyToCacheDirectory: true });
  if (r.canceled) return [];
  return r.assets.map((a) => ({ uri: a.uri, name: a.name, type: typeOf(a.name, a.mimeType), size: a.size }));
}

/** A picked photo or video, with the video's length in seconds (null for photos or when unknown). */
export type PickedMedia = PickedFile & { durationSec: number | null };

/** Photos and videos from the library for the profile gallery, several at once (up to `limit`). */
export async function pickMedia(limit: number): Promise<PickedMedia[]> {
  const r = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images', 'videos'],
    allowsMultipleSelection: true,
    selectionLimit: limit,
    quality: 0.85,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  if (r.canceled) return [];
  return r.assets.map((a) => {
    const video = a.type === 'video';
    const name = a.fileName || `${video ? 'video' : 'photo'}-${Date.now()}.${video ? 'mov' : 'jpg'}`;
    return { uri: a.uri, name, type: typeOf(name, a.mimeType), size: a.fileSize, durationSec: video && a.duration ? a.duration / 1000 : null };
  });
}
