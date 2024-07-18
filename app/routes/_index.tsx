import type { MetaFunction } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import { action } from '~/routes/meal-recognition';
import { ChangeEventHandler, useRef, useState } from 'react';

export const meta: MetaFunction = () => {
  return [
    { title: 'New Remix App' },
    { name: 'description', content: 'Welcome to Remix!' },
  ];
};

export default function Index() {
  const [imageBase64, setImageBase64] = useState('');
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const detailRef = useRef<HTMLSelectElement>(null);
  const languageRef = useRef<HTMLSelectElement>(null);

  const fetcher = useFetcher<typeof action>();

  const onChangeFile: ChangeEventHandler<HTMLInputElement> = async event => {
    const file = event.target.files?.[0];

    if (file) {
      const base64 = await blobToBase64(file);
      setImageBase64(base64);
    }
  };

  const onSubmit = async () => {
    fetcher.submit(
      {
        image: imageBase64,
        description: descriptionRef.current?.value || '',
        detail: detailRef.current?.value || 'low',
        language: languageRef.current?.value || 'en',
      },
      { action: '/meal-recognition', method: 'POST' }
    );
  };

  const { analysis } = fetcher.data || {};

  return (
    <div
      className="font-sans p-4"
      style={{ opacity: fetcher.state !== 'idle' ? 0.6 : 1 }}
    >
      <div className="flex flex-col gap-6 p-6 bg-gray-100 rounded-lg shadow-lg">
        <div className="w-full">
          <input
            type="file"
            accept="image/*"
            onChange={onChangeFile}
            className="w-full p-2 border border-gray-300 rounded-lg shadow-sm"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-6 w-full">
          <label className="flex flex-col w-full md:w-1/2">
            <span className="font-medium text-gray-700 mb-2">Description</span>
            <textarea
              className="border border-gray-300 p-3 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              ref={descriptionRef}
              placeholder="Additional description"
            />
          </label>

          <label className="flex flex-col w-full md:w-1/4">
            <a
              href="https://platform.openai.com/docs/guides/vision/low-or-high-fidelity-image-understanding"
              className="mb-2 text-blue-600 dark:text-blue-500 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Image Detail Level
            </a>
            <select
              ref={detailRef}
              className="border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="low">Low</option>
              <option value="auto">Auto</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="flex flex-col w-full md:w-1/4">
            <span className="font-medium text-gray-700 mb-2">Language</span>
            <select
              ref={languageRef}
              className="border border-gray-300 p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh">Chinese</option>
            </select>
          </label>
        </div>

        <div className="flex w-full mt-6">
          <button
            type="button"
            disabled={!imageBase64 || fetcher.state !== 'idle'}
            onClick={onSubmit}
            className={`border border-black p-3 rounded-lg shadow-md transition-opacity duration-300 ${
              imageBase64 && fetcher.state === 'idle'
                ? 'opacity-100 hover:bg-black hover:text-white'
                : 'opacity-50 cursor-not-allowed'
            }`}
          >
            Submit
          </button>
        </div>
      </div>

      {imageBase64 && (
        <div className="flex flex-col md:flex-row gap-6 p-6 pt-2 bg-gray-100 rounded-lg shadow-lg">
          <div className="flex-shrink-0">
            <img
              className="my-5 w-full md:w-auto max-w-md rounded-lg shadow-md"
              src={imageBase64}
              alt=""
            />
          </div>
          {analysis && (
            <div className="flex-1 p-4 bg-gray-50 rounded-lg shadow-md">
              <div>
                <div className="mb-6">
                  {analysis.foods.map((food, index) => (
                    <div
                      key={index}
                      className="mb-6 border-b border-gray-200 pb-4"
                    >
                      <h4 className="text-xl font-semibold text-gray-700 mb-2">
                        {food.name}
                      </h4>

                      {food.ingredients.map(
                        ({ macros, name: ingredientName }) => (
                          <div key={ingredientName} className="mb-4">
                            <h4 className="text-lg font-medium text-gray-600">
                              {ingredientName}
                            </h4>

                            <ul className="list-disc list-inside ml-4 text-gray-500">
                              <li className="mb-1">
                                Calories: {macros.calories}g
                              </li>
                              <li className="mb-1">
                                Proteins: {macros.proteins}g
                              </li>
                              <li className="mb-1">Carbs: {macros.carbs}g</li>
                              <li className="mb-1">Fat: {macros.fat}g</li>
                            </ul>
                          </div>
                        )
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 p-4 bg-white shadow rounded-lg">
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">
                    Summary
                  </h4>

                  <ul className="list-disc list-inside ml-4 text-gray-500">
                    <li className="mb-1">
                      Calories: {analysis.total.calories}g
                    </li>
                    <li className="mb-1">
                      Proteins: {analysis.total.proteins}g
                    </li>
                    <li className="mb-1">Carbs: {analysis.total.carbs}g</li>
                    <li className="mb-1">Fat: {analysis.total.fat}g</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {fetcher.data && (
        <div>
          <h4 className="mt-5 mb-2">DEBUG INFO</h4>
          <pre>{JSON.stringify(fetcher.data.response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}

function blobToBase64(blob: Blob): Promise<string> {
  const reader = new FileReader();
  reader.readAsDataURL(blob);
  return new Promise(resolve => {
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
  });
}
