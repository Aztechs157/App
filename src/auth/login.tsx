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

            const member = await db.member.findUnique({ where: { email: body.email } });
            if (!member) {
                set.status = 'Forbidden';
                return (
                    <Base>
                        <Login invalid />
                    </Base>
                );
            }

            const isCorrectPassword = await Bun.password.verify(body.password, member.password);
            if (!isCorrectPassword) {
                set.status = 'Forbidden';
                return (
                    <Base>
                        <Login invalid />
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
    invalid?: boolean;
}

function Login({ invalid }: LoginProps) {
    return (
        <div class="grid place-items-center w-screen h-screen bg-blue-300">
            {invalid && <p>Invalid email or password</p>}
            <form method="POST" class="flex flex-col w-1/3 bg-white rounded-lg p-10 border-black border gap-6">
                <Input type="email" name="email">
                    Email:
                </Input>
                <Input type="password" name="password">
                    Password:
                </Input>
                <input
                    type="submit"
                    value="Login"
                    class="bg-blue-300 hover:bg-blue-500 hover:text-white m-auto py-2 px-10 border-black border rounded-md"
                />
            </form>
        </div>
    );
}

interface InputProps {
    type: 'text' | 'email' | 'password';
    name: string;
    id?: string;
}
function Input({ type, children, name, id = name }: Html.PropsWithChildren<InputProps>) {
    return (
        <div class="flex flex-col gap-1">
            <label for={id}>{children}</label>
            <input type={type} name={name} id={id} class="border border-black rounded-md bg-blue-50" />
        </div>
    );
}
