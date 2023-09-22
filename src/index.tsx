import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { PrismaClient } from '@prisma/client';
import Html from '@kitajs/html';

const db = new PrismaClient();

const app = new Elysia()
    .use(html())
    .get('/', async ({ cookie }) => {
        const session = await db.session.findFirst({
            where: { id: cookie.session.value },
            include: { member: true },
        });

        const content = session?.member.name ?? 'You are not logged in!';

        return (
            <Base>
                <h1 safe>{content}</h1>
            </Base>
        );
    })
    .get('/login', async ({}) => {
        return (
            <Base>
                <form method="POST">
                    <input type="text" name="email" />
                    <input type="password" name="password" />
                    <input type="submit" />
                </form>
            </Base>
        );
    })
    .post(
        '/login',
        async ({ body, cookie }) => {
            console.log(body);
            const member = await db.member.findFirstOrThrow({ where: body });
            const session = await db.session.create({ data: { memberId: member.id } });
            cookie.session.value = session.id;
        },
        {
            body: t.Object({ email: t.String(), password: t.String() }),
        },
    )
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

function Base({ children }: Html.PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Library157</title>
                <script
                    src="https://unpkg.com/htmx.org@1.9.6"
                    integrity="sha384-FhXw7b6AlE/jyjlZH5iHa/tTe9EpJ1Y55RjcgPbjeWMskSxZt1v9qkxLJWNJaGni"
                    crossorigin="anonymous"
                ></script>
            </head>
            <body>{children}</body>
        </html>
    );
}
