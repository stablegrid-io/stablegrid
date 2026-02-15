const fetchStub = (...args) => fetch(...args);

module.exports = fetchStub;
module.exports.default = fetchStub;
module.exports.Headers = globalThis.Headers;
module.exports.Request = globalThis.Request;
module.exports.Response = globalThis.Response;
