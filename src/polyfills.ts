import { Buffer } from 'buffer';

window.global = window;
window.Buffer = Buffer;
// @ts-ignore
window.process = {
    env: { NODE_ENV: process.env.NODE_ENV },
    version: '',
    nextTick: (cb: Function) => setTimeout(cb, 0),
};