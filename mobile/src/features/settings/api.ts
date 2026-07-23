import { Api } from '@/shared/api/client';

export type FeedbackType = 'bug' | 'suggestion';

export type FeedbackImage = { uri: string; name: string; type: string };

export async function submitFeedback(
  Type: FeedbackType,
  Message: string,
  Image?: FeedbackImage | null,
): Promise<void> {
  if (Image == null) {
    await Api.post('/feedback', { type: Type, message: Message });

    return;
  }

  const Form = new FormData();

  Form.append('type', Type);
  Form.append('message', Message);
  Form.append('image', { uri: Image.uri, name: Image.name, type: Image.type } as unknown as Blob);

  await Api.post('/feedback', Form, { headers: { 'Content-Type': 'multipart/form-data' } });
}
