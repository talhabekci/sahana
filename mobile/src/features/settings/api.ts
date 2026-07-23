import { Api } from '@/shared/api/client';

export type FeedbackType = 'bug' | 'suggestion';

export async function submitFeedback(Type: FeedbackType, Message: string): Promise<void> {
  await Api.post('/feedback', { type: Type, message: Message });
}
