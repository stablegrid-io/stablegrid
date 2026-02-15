const fetchStub = (...args: Parameters<typeof fetch>) => fetch(...args);

export default fetchStub;
export const Headers = globalThis.Headers;
export const Request = globalThis.Request;
export const Response = globalThis.Response;
