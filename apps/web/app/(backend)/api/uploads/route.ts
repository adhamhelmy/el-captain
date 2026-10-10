import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { assertValid, protect, type AuthContext } from '@/lib/server/api';
import { ownsUpload, UPLOAD_RULES, type UploadKind } from '@/lib/shared/coach-rules';
import { ERROR_CODES } from '@/lib/shared/error-codes';

/**
 * Hands the browser a short-lived token to upload one file straight to Blob.
 * The file's kind decides the allowed types and size; the path must be in the coach's own folder.
 * The upload is only attached to the profile once the coach saves its path (see the profile routes).
 */
async function issueToken({ req, user }: AuthContext) {
  const body = (await req.json()) as HandleUploadBody;
  const result = await handleUpload({
    body,
    request: req,
    onBeforeGenerateToken: async (pathname, clientPayload) => {
      const kind = clientPayload as UploadKind;
      assertValid(Object.hasOwn(UPLOAD_RULES, kind ?? '') && ownsUpload(user.id, kind, pathname), 'Invalid upload', ERROR_CODES.INVALID_UPLOAD);
      const { types, maxBytes } = UPLOAD_RULES[kind];
      return { allowedContentTypes: [...types], maximumSizeInBytes: maxBytes, addRandomSuffix: true };
    },
  });
  return NextResponse.json(result);
}

export const POST = protect(issueToken, ['COACH']);
