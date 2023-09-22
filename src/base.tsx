import { Elysia, t } from 'elysia';
import Html from '@kitajs/html';
import { PrismaClient } from '@prisma/client';

export const db = new PrismaClient();
export const base = new Elysia();

export function Base({ children }: Html.PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Library157</title>
                <link rel="icon" href="data:," />
                <script
                    src="https://unpkg.com/htmx.org@1.9.6"
                    integrity="sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni"
                    crossorigin="anonymous"
                ></script>
                <link rel="stylesheet" href="./index.css" />
            </head>
            <body>{children}</body>
        </html>
    );
}
