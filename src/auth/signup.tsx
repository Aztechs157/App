import { Elysia, t } from 'elysia';
import Html from '@kitajs/html';
import { Base, db, base } from '../base';

export const signup = new Elysia()
    .use(base)
    .get(
        '/signup',
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
        '/signup',
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

            const session = await db.session.create({
                data: {
                    member: {
                        create: {
                            ...body,
                            password: await Bun.password.hash(body.password),
                        },
                    },
                },
            });
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
    );

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
            <input type="submit" value="Signup" />
        </form>
    );
}
