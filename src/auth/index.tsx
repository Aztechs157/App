import { Elysia, t } from 'elysia';
import { login } from './login';
import { signup } from './signup';

export const auth = new Elysia().use(login).use(signup);
