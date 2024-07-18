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
        detail: detailRef.current?.value || 'auto',
      },
      { action: '/meal-recognition', method: 'POST' }
    );
  };

  return (
    <div
      className="font-sans p-4"
      style={{ opacity: fetcher.state !== 'idle' ? 0.6 : 1 }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 15,
          alignItems: 'flex-start',
        }}
      >
        <div>
          <input type="file" accept="image/*" onChange={onChangeFile} />
        </div>
        <div className="flex gap-5">
          <label>
            Description
            <br />
            <textarea
              style={{
                border: '1px solid lightgrey',
                padding: 5,
                minWidth: 300,
              }}
              ref={descriptionRef}
              placeholder="Additional description"
            />
          </label>

          <label>
            <a
              href="https://platform.openai.com/docs/guides/vision/low-or-high-fidelity-image-understanding"
              className="text-blue-600 dark:text-blue-500 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Image Detail Level
            </a>
            <br />
            <select
              ref={detailRef}
              style={{ border: '1px solid lightgrey', padding: 5 }}
            >
              <option value="auto">Auto</option>
              <option value="low">Low</option>
              <option value="high">High</option>
            </select>
          </label>
        </div>

        <button
          type="button"
          disabled={!imageBase64}
          onClick={onSubmit}
          style={{
            border: '1px solid black',
            opacity: imageBase64 ? 1 : 0.2,
            padding: 8,
          }}
        >
          Submit
        </button>
      </div>
      {imageBase64 && (
        <img
          className="my-5"
          src={imageBase64}
          alt=""
          style={{ maxWidth: 400 }}
        />
      )}

      {fetcher.data && (
        <div>
          <pre style={{ whiteSpace: 'pre-line' }}>
            {fetcher.data.choices[0].message.content}
          </pre>

          <h4 className="mt-5 mb-2">DEBUG INFO</h4>
          <pre>{JSON.stringify(fetcher.data, null, 2)}</pre>
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
