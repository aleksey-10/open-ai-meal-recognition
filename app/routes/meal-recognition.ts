import { ActionFunctionArgs, json } from '@remix-run/node';
import { ChatCompletionContentPartImage } from 'openai/resources/index.mjs';
import { recognizeFoodMacros } from '~/utils';

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const image = form.get('image') as string;
  const description = form.get('description') as string;
  const language = form.get('language') as 'en' | 'zh';
  const detail = form.get('detail') as ChatCompletionContentPartImage.ImageURL['detail'];

  const { response, data: analysis } = await recognizeFoodMacros({
    image: image,
    description,
    detail,
    language,
  });

  return json({ response, analysis });
};
