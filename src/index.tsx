import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
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
                    <a href="/login">Login</a>
                    <br />
                    <a href="/logout">Logout</a>
                    <br />
                    <a href="/signup">Signup</a>
                    <h1 safe>{content}</h1>
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
