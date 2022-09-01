# docs-api

An easy-to-use documentation API

## Example

[Github Page Example](https://oguzhanumutlu.github.io/docs-api/tests/)

## Importing

```html

<script src="https://unpkg.com/json-documentation"></script>
```

## How to use?

- Create a html file.
- Create `docs.json` to the same directory
- Paste this sample:

```json
{
  "label": "Docs API",
  "pages": [
    {
      "label": "This is a category!",
      "description": "I am indeed a category!",
      "pages": [
        {
          "label": "This is a page!",
          "description": "I am indeed a page!",
          "id": "example",
          "href": "./example.md",
          "markdown": true
        }
      ]
    }
  ]
}
```

- Add the sample code to the html file you have created:

```html
<html>
<head>
    <title>Hello, world!</title>
    <script src="https://unpkg.com/json-documentation"></script>
</head>
</html>
```

- You're ready to go! Just enter to the html file using a host(can be localhost)!

## docs.json

Here's a typescript declaration that describes docs.json

```ts
type DocsNormalPage = {
    label: string,
    description: string | undefined,
    id: string | undefined,
    href: string | undefined,
    html: string | undefined,
    markdown: boolean | undefined
};

type DocsCategoryPage = {
    label: string,
    description: string | undefined,
    id: string | undefined,
    href: string | undefined,
    html: string | undefined,
    markdown: boolean | undefined,
    pages: DocsPage[]
};

type DocsPage = DocsNormalPage | DocsCategoryPage;

const DocsJson = {
    label: string,
    href: string | undefined,
    html: string | undefined,
    id: string | undefined,
    markdown: boolean | undefined,
    pages: DocsPage
};
```