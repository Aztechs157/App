import { Elysia, t } from 'elysia';
import Html from '@kitajs/html';
import { Base, db, base } from '../base';

export const login = new Elysia()
    .use(base)
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
        '/logout',
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
    );

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
