import { Elysia, t } from 'elysia';
import { html } from '@elysiajs/html';
import { PrismaClient } from '@prisma/client';
import Html from '@kitajs/html';

const db = new PrismaClient();

const app = new Elysia()
    .use(
        html({
            autoDoctype: 'full',
        }),
    )
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
    .get(
        '/login',
        async ({ cookie, set }) => {
            // If valid session, redirect to home
            if (cookie.session.value) {
                const session = await db.session.findFirst({ where: { id: cookie.session.value } });
                if (session) {
                    set.redirect = '/';
                    return;
                }
            }

            // Otherwise display login page
            return (
                <Base>
                    <Login />
                </Base>
            );
        },
        {
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .post(
        '/login',
        async ({ body, cookie, set }) => {
            // If session exists, try to delete
            if (cookie.session.value) {
                // If invalid session, ignore
                await db.session.delete({ where: { id: cookie.session.value } }).catch();
            }

            const member = await db.member.findFirst({ where: body });
            if (!member) {
                set.status = 'Forbidden';
                return (
                    <Base>
                        <Login invalidEmail />
                    </Base>
                );
            }

            const session = await db.session.create({ data: { memberId: member.id } });
            cookie.session.value = session.id;
            set.redirect = '/';
        },
        {
            body: t.Object({ email: t.String(), password: t.String() }),
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .get(
        'logout',
        async ({ cookie, set }) => {
            // If session exists, try to delete
            if (cookie.session.value) {
                // If invalid session, ignore
                await db.session.delete({ where: { id: cookie.session.value } }).catch();
            }

            cookie.session.remove();
            set.redirect = '/';
        },
        {
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .get(
        'signup',
        async ({ cookie, set }) => {
            // If valid session, redirect to home
            if (cookie.session.value) {
                const session = await db.session.findFirst({ where: { id: cookie.session.value } });
                if (session) {
                    set.redirect = '/';
                    return;
                }
            }

            return (
                <Base>
                    <Signup />
                </Base>
            );
        },
        {
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .post(
        'signup',
        async ({ body, cookie, set }) => {
            console.log(body);

            // If session exists, try to delete
            if (cookie.session.value) {
                // If invalid session, ignore
                await db.session.delete({ where: { id: cookie.session.value } }).catch();
            }

            if (await db.member.findUnique({ where: { email: body.email } })) {
                set.status = 'Forbidden';
                return (
                    <Base>
                        <Signup emailExists />
                    </Base>
                );
            }

            const session = await db.session.create({ data: { member: { create: body } } });
            cookie.session.value = session.id;
            set.redirect = '/';
        },
        {
            body: t.Object({
                email: t.String(),
                password: t.String(),
                name: t.String(),
                pronouns: t.String(),
            }),
            cookie: t.Object({
                session: t.Optional(t.String()),
            }),
        },
    )
    .listen(3000);

console.log(`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`);

interface SignupProps {
    emailExists?: boolean;
}

function Signup({ emailExists }: SignupProps) {
    return (
        <form method="POST">
            <input type="email" name="email" />
            {emailExists && 'Email already exists'}
            <input type="password" name="password" />
            <input type="text" name="name" />
            <input type="text" name="pronouns" />
            <input type="submit" />
        </form>
    );
}

interface LoginProps {
    invalidEmail?: boolean;
}

function Login({ invalidEmail }: LoginProps) {
    return (
        <>
            {invalidEmail && <p>Email does not exist</p>}
            <form method="POST">
                <input type="email" name="email" />
                <input type="password" name="password" />
                <input type="submit" />
            </form>
        </>
    );
}

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
