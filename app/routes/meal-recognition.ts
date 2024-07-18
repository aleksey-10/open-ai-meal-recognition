import { ActionFunctionArgs, json } from '@remix-run/node';
import { ChatCompletionContentPartImage } from 'openai/resources/index.mjs';
import { openai } from '~/entry.server';

export const action = async ({ request }: ActionFunctionArgs) => {
  const form = await request.formData();
  const image = form.get('image') as string;
  const description = form.get('description') as string;
  const detail = (form.get('detail') ||
    'auto') as ChatCompletionContentPartImage.ImageURL['detail'];

  const response = await recognizeFoodMacros({
    image: image,
    description,
    detail,
  });

  return json({ ...response });
};

async function recognizeFoodMacros({
  image,
  description,
  detail = 'auto',
}: {
  image: string;
  description?: string;
  detail?: ChatCompletionContentPartImage.ImageURL['detail'];
}) {
  let prompt =
    'Analyze the image. First, list the ingredients you can recognize in the food. Then, for each ingredient, provide the estimated macros (proteins, carbs, fats) and calories. Format the response as follows:\nIngredients:\n- Ingredient 1: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n- Ingredient 2: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n...';

  if (description) {
    prompt += ` To make your response more accurate here is an additional description: "${description}"`;
  }

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: image, detail } },
          { type: 'text', text: prompt },
        ],
      },
    ],
    max_tokens: 250,
    temperature: 0.5,
  });

  return response;
}
