import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { staticPlugin } from '@elysiajs/static';
import { PrismaClient } from '@prisma/client';
import { auth } from './auth';
import { Base } from './base';

const db = new PrismaClient();

const app = new Elysia()
    .use(
        html({
            autoDoctype: 'full',
        }),
    )
    .use(
        staticPlugin({
            prefix: '',
        }),
    )
    .use(auth)
    .get(
        '/',
        async ({ cookie }) => {
            const session = await db.session.findFirst({
                where: { id: cookie.session.value },
                include: { member: true },
            });

            const content = session?.member.name ?? 'You are not logged in!';

            return (
                <Base>
                    <nav class="flex w-1/2 justify-between">
                        <a href="/login">Login</a>
                        <a href="/logout">Logout</a>
                        <a href="/signup">Signup</a>
                    </nav>
                    <h1 safe class="text-xl font-bold">
                        {content}
                    </h1>
                </Base>
            );
        },
        {
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
