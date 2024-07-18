import {
  ChatCompletion,
  ChatCompletionContentPartImage,
} from 'openai/resources/index.mjs';
import { openai } from './entry.server';

interface NutritionInfo {
  proteins: number;
  carbs: number;
  calories: number;
  fats: number;
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
  data: { foods: Food[]; total: NutritionInfo } | null;
}> {
  //'Analyze the image. First, list the ingredients you can recognize in the food. Then, for each ingredient, provide the estimated macros (proteins, carbs, fats) and calories. Format the response as follows:\nIngredients:\n- Ingredient 1: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n- Ingredient 2: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X\n...Summary: Protein: Xg, Carbs: Xg, Fat: Xg, Calories: X';

  const exampleJson = `{
    "foods": [
      {
        "name": "Food1",
        "ingredients": [
          {
            "name": "Ing1",
            "m": {
              "p": 10,
              "c": 10,
              "f": 10,
              "cal": 100
            }
          },
          {
            "name": "Ing2",
            "m": {
              "p": 10,
              "c": 10,
              "f": 10,
              "cal": 100
            }
          }
        ]
      }
    ],
    "total": {
      "p": 20,
      "c": 20,
      "f": 20,
      "cal": 200
    }
  }`;

  let prompt = `Analyze the image. List the dishes and ingredients you recognize. Provide estimated macros (proteins, carbs, fats) and calories for each ingredient. Format the response as JSON ${
    language === 'zh' ? 'in Mandarin Chinese' : ''
  }: ${exampleJson}`;

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
      const parsedResponse = JSON.parse(jsonMatch[1].trim());

      const foods: Food[] = parsedResponse.foods.map(
        (food: {
          name: string;
          ingredients: { name: string; m: Record<string, number> }[];
        }) => ({
          name: food.name,
          ingredients: food.ingredients.map(ingredient => ({
            name: ingredient.name,
            macros: {
              proteins: ingredient.m.p,
              carbs: ingredient.m.c,
              fats: ingredient.m.f,
              calories: ingredient.m.cal,
            },
          })),
        })
      );

      const total: NutritionInfo = {
        proteins: parsedResponse.total.p,
        carbs: parsedResponse.total.c,
        fats: parsedResponse.total.f,
        calories: parsedResponse.total.cal,
      };

      return { foods, total };
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return null;
    }
  }

  console.error('No JSON found in the response');
  return null;
}
