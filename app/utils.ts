import {
  ChatCompletion,
  ChatCompletionContentPartImage,
} from 'openai/resources/index.mjs';
import { openai } from './entry.server';

interface NutritionInfo {
  proteins: number;
  carbs: number;
  calories: number;
  fat: number;
}

interface Ingredient {
  name: string;
  macros: NutritionInfo;
}

interface Food {
  name: string;
  ingredients: Ingredient[];
}

export async function recognizeFoodMacros({
  image,
  description,
  detail = 'low',
  language = 'en',
}: {
  image: string;
  description?: string;
  detail?: ChatCompletionContentPartImage.ImageURL['detail'];
  language: 'en' | 'zh';
}): Promise<{
  response: ChatCompletion;
  data: { foods: Food[]; total: NutritionInfo };
}> {
  const exampleJson = `{
      "foods": [
          {
              "name": "Food name 1",
              "ingredients": [
                  {
                      "name": "Ingredient 1",
                      "macros": {
                          "proteins": 20,
                          "carbs": 20,
                          "calories": 200,
                          "fat": 20
                      }
                  },
                  {
                      "name": "Ingredient 2",
                      "macros": {
                          "proteins": 20,
                          "carbs": 20,
                          "calories": 200,
                          "fat": 20
                      }
                  }
              ],
          },
          {
              "name": "Food name 1",
              "ingredients": [
                  {
                      "name": "Ingredient 1",
                      "macros": {
                          "proteins": 20,
                          "carbs": 20,
                          "calories": 200,
                          "fat": 20
                      }
                  },
                  {
                      "name": "Ingredient 2",
                      "macros": {
                          "proteins": 20,
                          "carbs": 20,
                          "calories": 200,
                          "fat": 20
                      }
                  }
              ],
          }
      ],
      "total": {
          "proteins": 40,
          "carbs": 40,
          "calories": 400,
          "fat": 40
      }
    }`;

  let prompt =
    //'Analyze the image. First, list the ingredients you can recognize in the food. Then, for each ingredient, provide the estimated macros (proteins, carbs, fats) and calories. Format the response as follows:\nIngredients:\n- Ingredient 1: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n- Ingredient 2: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n...Summary: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X';
    `Analyze the image. First, list the dishes you can see in the image and the ingredients you can recognize in each food. Then, for each ingredient, provide the estimated macros (proteins, carbs, fats) and calories. Format the response as following json ${
      language === 'zh' ? ' in Mandarin Chinese' : ''
    }: ${exampleJson}.`;

  if (description) {
    prompt += ` To make your response more accurate here is an additional description (Note: Regardless you see in the description keep the output format as described above): "${description}".`;
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
    //max_tokens: 700,
    temperature: 0.5,
  });

  return {
    response,
    data: extractJSON(response.choices[0].message.content || ''),
  };
}

function extractJSON(response: string) {
  // Regular expression to match the JSON part of the response
  const jsonMatch = response.match(/```json([\s\S]*?)```/);

  if (jsonMatch && jsonMatch[1]) {
    try {
      // Parse and return the extracted JSON
      return JSON.parse(jsonMatch[1].trim());
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }

  console.error('No JSON found in the response');
  return null;
}
