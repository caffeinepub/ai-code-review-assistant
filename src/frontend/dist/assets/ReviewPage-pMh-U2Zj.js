var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _currentQuery, _currentQueryInitialState, _currentResult, _currentResultState, _currentResultOptions, _currentThenable, _selectError, _selectFn, _selectResult, _lastQueryWithDefinedData, _staleTimeoutId, _refetchIntervalId, _currentRefetchInterval, _trackedProps, _QueryObserver_instances, executeFetch_fn, updateStaleTimeout_fn, computeRefetchInterval_fn, updateRefetchInterval_fn, updateTimers_fn, clearStaleTimeout_fn, clearRefetchInterval_fn, updateQuery_fn, notify_fn, _a, _client2, _currentResult2, _currentMutation, _mutateOptions, _MutationObserver_instances, updateResult_fn, notify_fn2, _b;
import { P as ProtocolError, T as TimeoutWaitingForResponseErrorCode, u as utf8ToBytes, E as ExternalError, M as MissingRootKeyErrorCode, C as Certificate, l as lookupResultToBuffer, R as RequestStatusResponseStatus, U as UnknownError, a as RequestStatusDoneNoReplyErrorCode, b as RejectError, c as CertifiedRejectErrorCode, d as UNREACHABLE_ERROR, I as InputError, e as InvalidReadStateRequestErrorCode, f as ReadRequestType, g as Principal, h as IDL, i as MissingCanisterIdErrorCode, H as HttpAgent, j as encode, Q as QueryResponseStatus, k as UncertifiedRejectErrorCode, m as isV3ResponseBody, n as isV2ResponseBody, o as UncertifiedRejectUpdateErrorCode, p as UnexpectedErrorCode, q as decode, S as Subscribable, r as pendingThenable, s as resolveEnabled, t as shallowEqualObjects, v as resolveStaleTime, w as noop, x as environmentManager, y as isValidTimeout, z as timeUntilStale, A as timeoutManager, B as focusManager, D as fetchState, F as replaceData, G as notifyManager, J as hashKey, K as getDefaultState, L as reactExports, N as shouldThrowError, O as useQueryClient, V as useInternetIdentity, W as createActorWithConfig, X as createLucideIcon, Y as jsxRuntimeExports, Z as Button, _ as CodeXml, $ as Record, a0 as Vec, a1 as Service, a2 as Func, a3 as Variant, a4 as Text, a5 as Nat, a6 as Nat8 } from "./index-B0BDIJgB.js";
import { C as ChevronDown, a as Cpu, B as Bug$1, S as Shield, b as Star, c as Clock, Z as Zap, T as TriangleAlert } from "./zap--WCFpS5v.js";
const FIVE_MINUTES_IN_MSEC = 5 * 60 * 1e3;
function defaultStrategy() {
  return chain(conditionalDelay(once(), 1e3), backoff(1e3, 1.2), timeout(FIVE_MINUTES_IN_MSEC));
}
function once() {
  let first = true;
  return async () => {
    if (first) {
      first = false;
      return true;
    }
    return false;
  };
}
function conditionalDelay(condition, timeInMsec) {
  return async (canisterId, requestId, status) => {
    if (await condition(canisterId, requestId, status)) {
      return new Promise((resolve) => setTimeout(resolve, timeInMsec));
    }
  };
}
function timeout(timeInMsec) {
  const end = Date.now() + timeInMsec;
  return async (_canisterId, requestId, status) => {
    if (Date.now() > end) {
      throw ProtocolError.fromCode(new TimeoutWaitingForResponseErrorCode(`Request timed out after ${timeInMsec} msec`, requestId, status));
    }
  };
}
function backoff(startingThrottleInMsec, backoffFactor) {
  let currentThrottling = startingThrottleInMsec;
  return () => new Promise((resolve) => setTimeout(() => {
    currentThrottling *= backoffFactor;
    resolve();
  }, currentThrottling));
}
function chain(...strategies) {
  return async (canisterId, requestId, status) => {
    for (const a of strategies) {
      await a(canisterId, requestId, status);
    }
  };
}
const DEFAULT_POLLING_OPTIONS = {
  preSignReadStateRequest: false
};
function hasProperty(value, property) {
  return Object.prototype.hasOwnProperty.call(value, property);
}
function isObjectWithProperty(value, property) {
  return value !== null && typeof value === "object" && hasProperty(value, property);
}
function hasFunction(value, property) {
  return hasProperty(value, property) && typeof value[property] === "function";
}
function isSignedReadStateRequestWithExpiry(value) {
  return isObjectWithProperty(value, "body") && isObjectWithProperty(value.body, "content") && value.body.content.request_type === ReadRequestType.ReadState && isObjectWithProperty(value.body.content, "ingress_expiry") && typeof value.body.content.ingress_expiry === "object" && value.body.content.ingress_expiry !== null && hasFunction(value.body.content.ingress_expiry, "toHash");
}
async function pollForResponse(agent, canisterId, requestId, options = {}) {
  const path = [utf8ToBytes("request_status"), requestId];
  let state;
  let currentRequest;
  const preSignReadStateRequest = options.preSignReadStateRequest ?? false;
  if (preSignReadStateRequest) {
    currentRequest = await constructRequest({
      paths: [path],
      agent,
      pollingOptions: options
    });
    state = await agent.readState(canisterId, { paths: [path] }, void 0, currentRequest);
  } else {
    state = await agent.readState(canisterId, { paths: [path] });
  }
  if (agent.rootKey == null) {
    throw ExternalError.fromCode(new MissingRootKeyErrorCode());
  }
  const cert = await Certificate.create({
    certificate: state.certificate,
    rootKey: agent.rootKey,
    canisterId,
    blsVerify: options.blsVerify,
    agent
  });
  const maybeBuf = lookupResultToBuffer(cert.lookup_path([...path, utf8ToBytes("status")]));
  let status;
  if (typeof maybeBuf === "undefined") {
    status = RequestStatusResponseStatus.Unknown;
  } else {
    status = new TextDecoder().decode(maybeBuf);
  }
  switch (status) {
    case RequestStatusResponseStatus.Replied: {
      return {
        reply: lookupResultToBuffer(cert.lookup_path([...path, "reply"])),
        certificate: cert
      };
    }
    case RequestStatusResponseStatus.Received:
    case RequestStatusResponseStatus.Unknown:
    case RequestStatusResponseStatus.Processing: {
      const strategy = options.strategy ?? defaultStrategy();
      await strategy(canisterId, requestId, status);
      return pollForResponse(agent, canisterId, requestId, {
        ...options,
        // Pass over either the strategy already provided or the new one created above
        strategy,
        request: currentRequest
      });
    }
    case RequestStatusResponseStatus.Rejected: {
      const rejectCode = new Uint8Array(lookupResultToBuffer(cert.lookup_path([...path, "reject_code"])))[0];
      const rejectMessage = new TextDecoder().decode(lookupResultToBuffer(cert.lookup_path([...path, "reject_message"])));
      const errorCodeBuf = lookupResultToBuffer(cert.lookup_path([...path, "error_code"]));
      const errorCode = errorCodeBuf ? new TextDecoder().decode(errorCodeBuf) : void 0;
      throw RejectError.fromCode(new CertifiedRejectErrorCode(requestId, rejectCode, rejectMessage, errorCode));
    }
    case RequestStatusResponseStatus.Done:
      throw UnknownError.fromCode(new RequestStatusDoneNoReplyErrorCode(requestId));
  }
  throw UNREACHABLE_ERROR;
}
async function constructRequest(options) {
  var _a2;
  const { paths, agent, pollingOptions } = options;
  if (pollingOptions.request && isSignedReadStateRequestWithExpiry(pollingOptions.request)) {
    return pollingOptions.request;
  }
  const request = await ((_a2 = agent.createReadStateRequest) == null ? void 0 : _a2.call(agent, {
    paths
  }, void 0));
  if (!isSignedReadStateRequestWithExpiry(request)) {
    throw InputError.fromCode(new InvalidReadStateRequestErrorCode(request));
  }
  return request;
}
const metadataSymbol = Symbol.for("ic-agent-metadata");
class Actor {
  /**
   * Get the Agent class this Actor would call, or undefined if the Actor would use
   * the default agent (global.ic.agent).
   * @param actor The actor to get the agent of.
   */
  static agentOf(actor) {
    return actor[metadataSymbol].config.agent;
  }
  /**
   * Get the interface of an actor, in the form of an instance of a Service.
   * @param actor The actor to get the interface of.
   */
  static interfaceOf(actor) {
    return actor[metadataSymbol].service;
  }
  static canisterIdOf(actor) {
    return Principal.from(actor[metadataSymbol].config.canisterId);
  }
  static createActorClass(interfaceFactory, options) {
    const service = interfaceFactory({ IDL });
    class CanisterActor extends Actor {
      constructor(config) {
        if (!config.canisterId) {
          throw InputError.fromCode(new MissingCanisterIdErrorCode(config.canisterId));
        }
        const canisterId = typeof config.canisterId === "string" ? Principal.fromText(config.canisterId) : config.canisterId;
        super({
          config: {
            ...DEFAULT_ACTOR_CONFIG,
            ...config,
            canisterId
          },
          service
        });
        for (const [methodName, func] of service._fields) {
          if (options == null ? void 0 : options.httpDetails) {
            func.annotations.push(ACTOR_METHOD_WITH_HTTP_DETAILS);
          }
          if (options == null ? void 0 : options.certificate) {
            func.annotations.push(ACTOR_METHOD_WITH_CERTIFICATE);
          }
          this[methodName] = _createActorMethod(this, methodName, func, config.blsVerify);
        }
      }
    }
    return CanisterActor;
  }
  /**
   * Creates an actor with the given interface factory and configuration.
   *
   * The [`@icp-sdk/bindgen`](https://js.icp.build/bindgen/) package can be used to generate the interface factory for your canister.
   * @param interfaceFactory - the interface factory for the actor, typically generated by the [`@icp-sdk/bindgen`](https://js.icp.build/bindgen/) package
   * @param configuration - the configuration for the actor
   * @returns an actor with the given interface factory and configuration
   * @example
   * Using the interface factory generated by the [`@icp-sdk/bindgen`](https://js.icp.build/bindgen/) package:
   * ```ts
   * import { Actor, HttpAgent } from '@icp-sdk/core/agent';
   * import { Principal } from '@icp-sdk/core/principal';
   * import { idlFactory } from './api/declarations/hello-world.did';
   *
   * const canisterId = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
   *
   * const agent = await HttpAgent.create({
   *   host: 'https://icp-api.io',
   * });
   *
   * const actor = Actor.createActor(idlFactory, {
   *   agent,
   *   canisterId,
   * });
   *
   * const response = await actor.greet('world');
   * console.log(response);
   * ```
   * @example
   * Using the `createActor` wrapper function generated by the [`@icp-sdk/bindgen`](https://js.icp.build/bindgen/) package:
   * ```ts
   * import { HttpAgent } from '@icp-sdk/core/agent';
   * import { Principal } from '@icp-sdk/core/principal';
   * import { createActor } from './api/hello-world';
   *
   * const canisterId = Principal.fromText('rrkah-fqaaa-aaaaa-aaaaq-cai');
   *
   * const agent = await HttpAgent.create({
   *   host: 'https://icp-api.io',
   * });
   *
   * const actor = createActor(canisterId, {
   *   agent,
   * });
   *
   * const response = await actor.greet('world');
   * console.log(response);
   * ```
   */
  static createActor(interfaceFactory, configuration) {
    if (!configuration.canisterId) {
      throw InputError.fromCode(new MissingCanisterIdErrorCode(configuration.canisterId));
    }
    return new (this.createActorClass(interfaceFactory))(configuration);
  }
  /**
   * Returns an actor with methods that return the http response details along with the result
   * @param interfaceFactory - the interface factory for the actor
   * @param configuration - the configuration for the actor
   * @deprecated - use createActor with actorClassOptions instead
   */
  static createActorWithHttpDetails(interfaceFactory, configuration) {
    return new (this.createActorClass(interfaceFactory, { httpDetails: true }))(configuration);
  }
  /**
   * Returns an actor with methods that return the http response details along with the result
   * @param interfaceFactory - the interface factory for the actor
   * @param configuration - the configuration for the actor
   * @param actorClassOptions - options for the actor class extended details to return with the result
   */
  static createActorWithExtendedDetails(interfaceFactory, configuration, actorClassOptions = {
    httpDetails: true,
    certificate: true
  }) {
    return new (this.createActorClass(interfaceFactory, actorClassOptions))(configuration);
  }
  constructor(metadata) {
    this[metadataSymbol] = Object.freeze(metadata);
  }
}
function decodeReturnValue(types, msg) {
  const returnValues = decode(types, msg);
  switch (returnValues.length) {
    case 0:
      return void 0;
    case 1:
      return returnValues[0];
    default:
      return returnValues;
  }
}
const DEFAULT_ACTOR_CONFIG = {
  pollingOptions: DEFAULT_POLLING_OPTIONS
};
const ACTOR_METHOD_WITH_HTTP_DETAILS = "http-details";
const ACTOR_METHOD_WITH_CERTIFICATE = "certificate";
function _createActorMethod(actor, methodName, func, blsVerify) {
  let caller;
  if (func.annotations.includes("query") || func.annotations.includes("composite_query")) {
    caller = async (options, ...args) => {
      var _a2, _b2;
      options = {
        ...options,
        ...(_b2 = (_a2 = actor[metadataSymbol].config).queryTransform) == null ? void 0 : _b2.call(_a2, methodName, args, {
          ...actor[metadataSymbol].config,
          ...options
        })
      };
      const agent = options.agent || actor[metadataSymbol].config.agent || new HttpAgent();
      const cid = Principal.from(options.canisterId || actor[metadataSymbol].config.canisterId);
      const arg = encode(func.argTypes, args);
      const result = await agent.query(cid, {
        methodName,
        arg,
        effectiveCanisterId: options.effectiveCanisterId
      });
      const httpDetails = {
        ...result.httpDetails,
        requestDetails: result.requestDetails
      };
      switch (result.status) {
        case QueryResponseStatus.Rejected: {
          const uncertifiedRejectErrorCode = new UncertifiedRejectErrorCode(result.requestId, result.reject_code, result.reject_message, result.error_code, result.signatures);
          uncertifiedRejectErrorCode.callContext = {
            canisterId: cid,
            methodName,
            httpDetails
          };
          throw RejectError.fromCode(uncertifiedRejectErrorCode);
        }
        case QueryResponseStatus.Replied:
          return func.annotations.includes(ACTOR_METHOD_WITH_HTTP_DETAILS) ? {
            httpDetails,
            result: decodeReturnValue(func.retTypes, result.reply.arg)
          } : decodeReturnValue(func.retTypes, result.reply.arg);
      }
    };
  } else {
    caller = async (options, ...args) => {
      var _a2, _b2;
      options = {
        ...options,
        ...(_b2 = (_a2 = actor[metadataSymbol].config).callTransform) == null ? void 0 : _b2.call(_a2, methodName, args, {
          ...actor[metadataSymbol].config,
          ...options
        })
      };
      const agent = options.agent || actor[metadataSymbol].config.agent || HttpAgent.createSync();
      const { canisterId, effectiveCanisterId, pollingOptions } = {
        ...DEFAULT_ACTOR_CONFIG,
        ...actor[metadataSymbol].config,
        ...options
      };
      const cid = Principal.from(canisterId);
      const ecid = effectiveCanisterId !== void 0 ? Principal.from(effectiveCanisterId) : cid;
      const arg = encode(func.argTypes, args);
      const { requestId, response, requestDetails } = await agent.call(cid, {
        methodName,
        arg,
        effectiveCanisterId: ecid,
        nonce: options.nonce
      });
      let reply;
      let certificate;
      if (isV3ResponseBody(response.body)) {
        if (agent.rootKey == null) {
          throw ExternalError.fromCode(new MissingRootKeyErrorCode());
        }
        const cert = response.body.certificate;
        certificate = await Certificate.create({
          certificate: cert,
          rootKey: agent.rootKey,
          canisterId: ecid,
          blsVerify,
          agent
        });
        const path = [utf8ToBytes("request_status"), requestId];
        const status = new TextDecoder().decode(lookupResultToBuffer(certificate.lookup_path([...path, "status"])));
        switch (status) {
          case "replied":
            reply = lookupResultToBuffer(certificate.lookup_path([...path, "reply"]));
            break;
          case "rejected": {
            const rejectCode = new Uint8Array(lookupResultToBuffer(certificate.lookup_path([...path, "reject_code"])))[0];
            const rejectMessage = new TextDecoder().decode(lookupResultToBuffer(certificate.lookup_path([...path, "reject_message"])));
            const error_code_buf = lookupResultToBuffer(certificate.lookup_path([...path, "error_code"]));
            const error_code = error_code_buf ? new TextDecoder().decode(error_code_buf) : void 0;
            const certifiedRejectErrorCode = new CertifiedRejectErrorCode(requestId, rejectCode, rejectMessage, error_code);
            certifiedRejectErrorCode.callContext = {
              canisterId: cid,
              methodName,
              httpDetails: response
            };
            throw RejectError.fromCode(certifiedRejectErrorCode);
          }
        }
      } else if (isV2ResponseBody(response.body)) {
        const { reject_code, reject_message, error_code } = response.body;
        const errorCode = new UncertifiedRejectUpdateErrorCode(requestId, reject_code, reject_message, error_code);
        errorCode.callContext = {
          canisterId: cid,
          methodName,
          httpDetails: response
        };
        throw RejectError.fromCode(errorCode);
      }
      if (response.status === 202) {
        const pollOptions = {
          ...pollingOptions,
          blsVerify
        };
        const response2 = await pollForResponse(agent, ecid, requestId, pollOptions);
        certificate = response2.certificate;
        reply = response2.reply;
      }
      const shouldIncludeHttpDetails = func.annotations.includes(ACTOR_METHOD_WITH_HTTP_DETAILS);
      const shouldIncludeCertificate = func.annotations.includes(ACTOR_METHOD_WITH_CERTIFICATE);
      const httpDetails = { ...response, requestDetails };
      if (reply !== void 0) {
        if (shouldIncludeHttpDetails && shouldIncludeCertificate) {
          return {
            httpDetails,
            certificate,
            result: decodeReturnValue(func.retTypes, reply)
          };
        } else if (shouldIncludeCertificate) {
          return {
            certificate,
            result: decodeReturnValue(func.retTypes, reply)
          };
        } else if (shouldIncludeHttpDetails) {
          return {
            httpDetails,
            result: decodeReturnValue(func.retTypes, reply)
          };
        }
        return decodeReturnValue(func.retTypes, reply);
      } else {
        const errorCode = new UnexpectedErrorCode(`Call was returned undefined. We cannot determine if the call was successful or not. Return types: [${func.retTypes.map((t) => t.display()).join(",")}].`);
        errorCode.callContext = {
          canisterId: cid,
          methodName,
          httpDetails
        };
        throw UnknownError.fromCode(errorCode);
      }
    };
  }
  const handler = (...args) => caller({}, ...args);
  handler.withOptions = (options) => (...args) => caller(options, ...args);
  return handler;
}
var QueryObserver = (_a = class extends Subscribable {
  constructor(client, options) {
    super();
    __privateAdd(this, _QueryObserver_instances);
    __privateAdd(this, _client);
    __privateAdd(this, _currentQuery);
    __privateAdd(this, _currentQueryInitialState);
    __privateAdd(this, _currentResult);
    __privateAdd(this, _currentResultState);
    __privateAdd(this, _currentResultOptions);
    __privateAdd(this, _currentThenable);
    __privateAdd(this, _selectError);
    __privateAdd(this, _selectFn);
    __privateAdd(this, _selectResult);
    // This property keeps track of the last query with defined data.
    // It will be used to pass the previous data and query to the placeholder function between renders.
    __privateAdd(this, _lastQueryWithDefinedData);
    __privateAdd(this, _staleTimeoutId);
    __privateAdd(this, _refetchIntervalId);
    __privateAdd(this, _currentRefetchInterval);
    __privateAdd(this, _trackedProps, /* @__PURE__ */ new Set());
    this.options = options;
    __privateSet(this, _client, client);
    __privateSet(this, _selectError, null);
    __privateSet(this, _currentThenable, pendingThenable());
    this.bindMethods();
    this.setOptions(options);
  }
  bindMethods() {
    this.refetch = this.refetch.bind(this);
  }
  onSubscribe() {
    if (this.listeners.size === 1) {
      __privateGet(this, _currentQuery).addObserver(this);
      if (shouldFetchOnMount(__privateGet(this, _currentQuery), this.options)) {
        __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
      } else {
        this.updateResult();
      }
      __privateMethod(this, _QueryObserver_instances, updateTimers_fn).call(this);
    }
  }
  onUnsubscribe() {
    if (!this.hasListeners()) {
      this.destroy();
    }
  }
  shouldFetchOnReconnect() {
    return shouldFetchOn(
      __privateGet(this, _currentQuery),
      this.options,
      this.options.refetchOnReconnect
    );
  }
  shouldFetchOnWindowFocus() {
    return shouldFetchOn(
      __privateGet(this, _currentQuery),
      this.options,
      this.options.refetchOnWindowFocus
    );
  }
  destroy() {
    this.listeners = /* @__PURE__ */ new Set();
    __privateMethod(this, _QueryObserver_instances, clearStaleTimeout_fn).call(this);
    __privateMethod(this, _QueryObserver_instances, clearRefetchInterval_fn).call(this);
    __privateGet(this, _currentQuery).removeObserver(this);
  }
  setOptions(options) {
    const prevOptions = this.options;
    const prevQuery = __privateGet(this, _currentQuery);
    this.options = __privateGet(this, _client).defaultQueryOptions(options);
    if (this.options.enabled !== void 0 && typeof this.options.enabled !== "boolean" && typeof this.options.enabled !== "function" && typeof resolveEnabled(this.options.enabled, __privateGet(this, _currentQuery)) !== "boolean") {
      throw new Error(
        "Expected enabled to be a boolean or a callback that returns a boolean"
      );
    }
    __privateMethod(this, _QueryObserver_instances, updateQuery_fn).call(this);
    __privateGet(this, _currentQuery).setOptions(this.options);
    if (prevOptions._defaulted && !shallowEqualObjects(this.options, prevOptions)) {
      __privateGet(this, _client).getQueryCache().notify({
        type: "observerOptionsUpdated",
        query: __privateGet(this, _currentQuery),
        observer: this
      });
    }
    const mounted = this.hasListeners();
    if (mounted && shouldFetchOptionally(
      __privateGet(this, _currentQuery),
      prevQuery,
      this.options,
      prevOptions
    )) {
      __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
    }
    this.updateResult();
    if (mounted && (__privateGet(this, _currentQuery) !== prevQuery || resolveEnabled(this.options.enabled, __privateGet(this, _currentQuery)) !== resolveEnabled(prevOptions.enabled, __privateGet(this, _currentQuery)) || resolveStaleTime(this.options.staleTime, __privateGet(this, _currentQuery)) !== resolveStaleTime(prevOptions.staleTime, __privateGet(this, _currentQuery)))) {
      __privateMethod(this, _QueryObserver_instances, updateStaleTimeout_fn).call(this);
    }
    const nextRefetchInterval = __privateMethod(this, _QueryObserver_instances, computeRefetchInterval_fn).call(this);
    if (mounted && (__privateGet(this, _currentQuery) !== prevQuery || resolveEnabled(this.options.enabled, __privateGet(this, _currentQuery)) !== resolveEnabled(prevOptions.enabled, __privateGet(this, _currentQuery)) || nextRefetchInterval !== __privateGet(this, _currentRefetchInterval))) {
      __privateMethod(this, _QueryObserver_instances, updateRefetchInterval_fn).call(this, nextRefetchInterval);
    }
  }
  getOptimisticResult(options) {
    const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), options);
    const result = this.createResult(query, options);
    if (shouldAssignObserverCurrentProperties(this, result)) {
      __privateSet(this, _currentResult, result);
      __privateSet(this, _currentResultOptions, this.options);
      __privateSet(this, _currentResultState, __privateGet(this, _currentQuery).state);
    }
    return result;
  }
  getCurrentResult() {
    return __privateGet(this, _currentResult);
  }
  trackResult(result, onPropTracked) {
    return new Proxy(result, {
      get: (target, key) => {
        this.trackProp(key);
        onPropTracked == null ? void 0 : onPropTracked(key);
        if (key === "promise") {
          this.trackProp("data");
          if (!this.options.experimental_prefetchInRender && __privateGet(this, _currentThenable).status === "pending") {
            __privateGet(this, _currentThenable).reject(
              new Error(
                "experimental_prefetchInRender feature flag is not enabled"
              )
            );
          }
        }
        return Reflect.get(target, key);
      }
    });
  }
  trackProp(key) {
    __privateGet(this, _trackedProps).add(key);
  }
  getCurrentQuery() {
    return __privateGet(this, _currentQuery);
  }
  refetch({ ...options } = {}) {
    return this.fetch({
      ...options
    });
  }
  fetchOptimistic(options) {
    const defaultedOptions = __privateGet(this, _client).defaultQueryOptions(options);
    const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), defaultedOptions);
    return query.fetch().then(() => this.createResult(query, defaultedOptions));
  }
  fetch(fetchOptions) {
    return __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this, {
      ...fetchOptions,
      cancelRefetch: fetchOptions.cancelRefetch ?? true
    }).then(() => {
      this.updateResult();
      return __privateGet(this, _currentResult);
    });
  }
  createResult(query, options) {
    var _a2;
    const prevQuery = __privateGet(this, _currentQuery);
    const prevOptions = this.options;
    const prevResult = __privateGet(this, _currentResult);
    const prevResultState = __privateGet(this, _currentResultState);
    const prevResultOptions = __privateGet(this, _currentResultOptions);
    const queryChange = query !== prevQuery;
    const queryInitialState = queryChange ? query.state : __privateGet(this, _currentQueryInitialState);
    const { state } = query;
    let newState = { ...state };
    let isPlaceholderData = false;
    let data;
    if (options._optimisticResults) {
      const mounted = this.hasListeners();
      const fetchOnMount = !mounted && shouldFetchOnMount(query, options);
      const fetchOptionally = mounted && shouldFetchOptionally(query, prevQuery, options, prevOptions);
      if (fetchOnMount || fetchOptionally) {
        newState = {
          ...newState,
          ...fetchState(state.data, query.options)
        };
      }
      if (options._optimisticResults === "isRestoring") {
        newState.fetchStatus = "idle";
      }
    }
    let { error, errorUpdatedAt, status } = newState;
    data = newState.data;
    let skipSelect = false;
    if (options.placeholderData !== void 0 && data === void 0 && status === "pending") {
      let placeholderData;
      if ((prevResult == null ? void 0 : prevResult.isPlaceholderData) && options.placeholderData === (prevResultOptions == null ? void 0 : prevResultOptions.placeholderData)) {
        placeholderData = prevResult.data;
        skipSelect = true;
      } else {
        placeholderData = typeof options.placeholderData === "function" ? options.placeholderData(
          (_a2 = __privateGet(this, _lastQueryWithDefinedData)) == null ? void 0 : _a2.state.data,
          __privateGet(this, _lastQueryWithDefinedData)
        ) : options.placeholderData;
      }
      if (placeholderData !== void 0) {
        status = "success";
        data = replaceData(
          prevResult == null ? void 0 : prevResult.data,
          placeholderData,
          options
        );
        isPlaceholderData = true;
      }
    }
    if (options.select && data !== void 0 && !skipSelect) {
      if (prevResult && data === (prevResultState == null ? void 0 : prevResultState.data) && options.select === __privateGet(this, _selectFn)) {
        data = __privateGet(this, _selectResult);
      } else {
        try {
          __privateSet(this, _selectFn, options.select);
          data = options.select(data);
          data = replaceData(prevResult == null ? void 0 : prevResult.data, data, options);
          __privateSet(this, _selectResult, data);
          __privateSet(this, _selectError, null);
        } catch (selectError) {
          __privateSet(this, _selectError, selectError);
        }
      }
    }
    if (__privateGet(this, _selectError)) {
      error = __privateGet(this, _selectError);
      data = __privateGet(this, _selectResult);
      errorUpdatedAt = Date.now();
      status = "error";
    }
    const isFetching = newState.fetchStatus === "fetching";
    const isPending = status === "pending";
    const isError = status === "error";
    const isLoading = isPending && isFetching;
    const hasData = data !== void 0;
    const result = {
      status,
      fetchStatus: newState.fetchStatus,
      isPending,
      isSuccess: status === "success",
      isError,
      isInitialLoading: isLoading,
      isLoading,
      data,
      dataUpdatedAt: newState.dataUpdatedAt,
      error,
      errorUpdatedAt,
      failureCount: newState.fetchFailureCount,
      failureReason: newState.fetchFailureReason,
      errorUpdateCount: newState.errorUpdateCount,
      isFetched: query.isFetched(),
      isFetchedAfterMount: newState.dataUpdateCount > queryInitialState.dataUpdateCount || newState.errorUpdateCount > queryInitialState.errorUpdateCount,
      isFetching,
      isRefetching: isFetching && !isPending,
      isLoadingError: isError && !hasData,
      isPaused: newState.fetchStatus === "paused",
      isPlaceholderData,
      isRefetchError: isError && hasData,
      isStale: isStale(query, options),
      refetch: this.refetch,
      promise: __privateGet(this, _currentThenable),
      isEnabled: resolveEnabled(options.enabled, query) !== false
    };
    const nextResult = result;
    if (this.options.experimental_prefetchInRender) {
      const hasResultData = nextResult.data !== void 0;
      const isErrorWithoutData = nextResult.status === "error" && !hasResultData;
      const finalizeThenableIfPossible = (thenable) => {
        if (isErrorWithoutData) {
          thenable.reject(nextResult.error);
        } else if (hasResultData) {
          thenable.resolve(nextResult.data);
        }
      };
      const recreateThenable = () => {
        const pending = __privateSet(this, _currentThenable, nextResult.promise = pendingThenable());
        finalizeThenableIfPossible(pending);
      };
      const prevThenable = __privateGet(this, _currentThenable);
      switch (prevThenable.status) {
        case "pending":
          if (query.queryHash === prevQuery.queryHash) {
            finalizeThenableIfPossible(prevThenable);
          }
          break;
        case "fulfilled":
          if (isErrorWithoutData || nextResult.data !== prevThenable.value) {
            recreateThenable();
          }
          break;
        case "rejected":
          if (!isErrorWithoutData || nextResult.error !== prevThenable.reason) {
            recreateThenable();
          }
          break;
      }
    }
    return nextResult;
  }
  updateResult() {
    const prevResult = __privateGet(this, _currentResult);
    const nextResult = this.createResult(__privateGet(this, _currentQuery), this.options);
    __privateSet(this, _currentResultState, __privateGet(this, _currentQuery).state);
    __privateSet(this, _currentResultOptions, this.options);
    if (__privateGet(this, _currentResultState).data !== void 0) {
      __privateSet(this, _lastQueryWithDefinedData, __privateGet(this, _currentQuery));
    }
    if (shallowEqualObjects(nextResult, prevResult)) {
      return;
    }
    __privateSet(this, _currentResult, nextResult);
    const shouldNotifyListeners = () => {
      if (!prevResult) {
        return true;
      }
      const { notifyOnChangeProps } = this.options;
      const notifyOnChangePropsValue = typeof notifyOnChangeProps === "function" ? notifyOnChangeProps() : notifyOnChangeProps;
      if (notifyOnChangePropsValue === "all" || !notifyOnChangePropsValue && !__privateGet(this, _trackedProps).size) {
        return true;
      }
      const includedProps = new Set(
        notifyOnChangePropsValue ?? __privateGet(this, _trackedProps)
      );
      if (this.options.throwOnError) {
        includedProps.add("error");
      }
      return Object.keys(__privateGet(this, _currentResult)).some((key) => {
        const typedKey = key;
        const changed = __privateGet(this, _currentResult)[typedKey] !== prevResult[typedKey];
        return changed && includedProps.has(typedKey);
      });
    };
    __privateMethod(this, _QueryObserver_instances, notify_fn).call(this, { listeners: shouldNotifyListeners() });
  }
  onQueryUpdate() {
    this.updateResult();
    if (this.hasListeners()) {
      __privateMethod(this, _QueryObserver_instances, updateTimers_fn).call(this);
    }
  }
}, _client = new WeakMap(), _currentQuery = new WeakMap(), _currentQueryInitialState = new WeakMap(), _currentResult = new WeakMap(), _currentResultState = new WeakMap(), _currentResultOptions = new WeakMap(), _currentThenable = new WeakMap(), _selectError = new WeakMap(), _selectFn = new WeakMap(), _selectResult = new WeakMap(), _lastQueryWithDefinedData = new WeakMap(), _staleTimeoutId = new WeakMap(), _refetchIntervalId = new WeakMap(), _currentRefetchInterval = new WeakMap(), _trackedProps = new WeakMap(), _QueryObserver_instances = new WeakSet(), executeFetch_fn = function(fetchOptions) {
  __privateMethod(this, _QueryObserver_instances, updateQuery_fn).call(this);
  let promise = __privateGet(this, _currentQuery).fetch(
    this.options,
    fetchOptions
  );
  if (!(fetchOptions == null ? void 0 : fetchOptions.throwOnError)) {
    promise = promise.catch(noop);
  }
  return promise;
}, updateStaleTimeout_fn = function() {
  __privateMethod(this, _QueryObserver_instances, clearStaleTimeout_fn).call(this);
  const staleTime = resolveStaleTime(
    this.options.staleTime,
    __privateGet(this, _currentQuery)
  );
  if (environmentManager.isServer() || __privateGet(this, _currentResult).isStale || !isValidTimeout(staleTime)) {
    return;
  }
  const time = timeUntilStale(__privateGet(this, _currentResult).dataUpdatedAt, staleTime);
  const timeout2 = time + 1;
  __privateSet(this, _staleTimeoutId, timeoutManager.setTimeout(() => {
    if (!__privateGet(this, _currentResult).isStale) {
      this.updateResult();
    }
  }, timeout2));
}, computeRefetchInterval_fn = function() {
  return (typeof this.options.refetchInterval === "function" ? this.options.refetchInterval(__privateGet(this, _currentQuery)) : this.options.refetchInterval) ?? false;
}, updateRefetchInterval_fn = function(nextInterval) {
  __privateMethod(this, _QueryObserver_instances, clearRefetchInterval_fn).call(this);
  __privateSet(this, _currentRefetchInterval, nextInterval);
  if (environmentManager.isServer() || resolveEnabled(this.options.enabled, __privateGet(this, _currentQuery)) === false || !isValidTimeout(__privateGet(this, _currentRefetchInterval)) || __privateGet(this, _currentRefetchInterval) === 0) {
    return;
  }
  __privateSet(this, _refetchIntervalId, timeoutManager.setInterval(() => {
    if (this.options.refetchIntervalInBackground || focusManager.isFocused()) {
      __privateMethod(this, _QueryObserver_instances, executeFetch_fn).call(this);
    }
  }, __privateGet(this, _currentRefetchInterval)));
}, updateTimers_fn = function() {
  __privateMethod(this, _QueryObserver_instances, updateStaleTimeout_fn).call(this);
  __privateMethod(this, _QueryObserver_instances, updateRefetchInterval_fn).call(this, __privateMethod(this, _QueryObserver_instances, computeRefetchInterval_fn).call(this));
}, clearStaleTimeout_fn = function() {
  if (__privateGet(this, _staleTimeoutId)) {
    timeoutManager.clearTimeout(__privateGet(this, _staleTimeoutId));
    __privateSet(this, _staleTimeoutId, void 0);
  }
}, clearRefetchInterval_fn = function() {
  if (__privateGet(this, _refetchIntervalId)) {
    timeoutManager.clearInterval(__privateGet(this, _refetchIntervalId));
    __privateSet(this, _refetchIntervalId, void 0);
  }
}, updateQuery_fn = function() {
  const query = __privateGet(this, _client).getQueryCache().build(__privateGet(this, _client), this.options);
  if (query === __privateGet(this, _currentQuery)) {
    return;
  }
  const prevQuery = __privateGet(this, _currentQuery);
  __privateSet(this, _currentQuery, query);
  __privateSet(this, _currentQueryInitialState, query.state);
  if (this.hasListeners()) {
    prevQuery == null ? void 0 : prevQuery.removeObserver(this);
    query.addObserver(this);
  }
}, notify_fn = function(notifyOptions) {
  notifyManager.batch(() => {
    if (notifyOptions.listeners) {
      this.listeners.forEach((listener) => {
        listener(__privateGet(this, _currentResult));
      });
    }
    __privateGet(this, _client).getQueryCache().notify({
      query: __privateGet(this, _currentQuery),
      type: "observerResultsUpdated"
    });
  });
}, _a);
function shouldLoadOnMount(query, options) {
  return resolveEnabled(options.enabled, query) !== false && query.state.data === void 0 && !(query.state.status === "error" && options.retryOnMount === false);
}
function shouldFetchOnMount(query, options) {
  return shouldLoadOnMount(query, options) || query.state.data !== void 0 && shouldFetchOn(query, options, options.refetchOnMount);
}
function shouldFetchOn(query, options, field) {
  if (resolveEnabled(options.enabled, query) !== false && resolveStaleTime(options.staleTime, query) !== "static") {
    const value = typeof field === "function" ? field(query) : field;
    return value === "always" || value !== false && isStale(query, options);
  }
  return false;
}
function shouldFetchOptionally(query, prevQuery, options, prevOptions) {
  return (query !== prevQuery || resolveEnabled(prevOptions.enabled, query) === false) && (!options.suspense || query.state.status !== "error") && isStale(query, options);
}
function isStale(query, options) {
  return resolveEnabled(options.enabled, query) !== false && query.isStaleByTime(resolveStaleTime(options.staleTime, query));
}
function shouldAssignObserverCurrentProperties(observer, optimisticResult) {
  if (!shallowEqualObjects(observer.getCurrentResult(), optimisticResult)) {
    return true;
  }
  return false;
}
var MutationObserver = (_b = class extends Subscribable {
  constructor(client, options) {
    super();
    __privateAdd(this, _MutationObserver_instances);
    __privateAdd(this, _client2);
    __privateAdd(this, _currentResult2);
    __privateAdd(this, _currentMutation);
    __privateAdd(this, _mutateOptions);
    __privateSet(this, _client2, client);
    this.setOptions(options);
    this.bindMethods();
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
  }
  bindMethods() {
    this.mutate = this.mutate.bind(this);
    this.reset = this.reset.bind(this);
  }
  setOptions(options) {
    var _a2;
    const prevOptions = this.options;
    this.options = __privateGet(this, _client2).defaultMutationOptions(options);
    if (!shallowEqualObjects(this.options, prevOptions)) {
      __privateGet(this, _client2).getMutationCache().notify({
        type: "observerOptionsUpdated",
        mutation: __privateGet(this, _currentMutation),
        observer: this
      });
    }
    if ((prevOptions == null ? void 0 : prevOptions.mutationKey) && this.options.mutationKey && hashKey(prevOptions.mutationKey) !== hashKey(this.options.mutationKey)) {
      this.reset();
    } else if (((_a2 = __privateGet(this, _currentMutation)) == null ? void 0 : _a2.state.status) === "pending") {
      __privateGet(this, _currentMutation).setOptions(this.options);
    }
  }
  onUnsubscribe() {
    var _a2;
    if (!this.hasListeners()) {
      (_a2 = __privateGet(this, _currentMutation)) == null ? void 0 : _a2.removeObserver(this);
    }
  }
  onMutationUpdate(action) {
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
    __privateMethod(this, _MutationObserver_instances, notify_fn2).call(this, action);
  }
  getCurrentResult() {
    return __privateGet(this, _currentResult2);
  }
  reset() {
    var _a2;
    (_a2 = __privateGet(this, _currentMutation)) == null ? void 0 : _a2.removeObserver(this);
    __privateSet(this, _currentMutation, void 0);
    __privateMethod(this, _MutationObserver_instances, updateResult_fn).call(this);
    __privateMethod(this, _MutationObserver_instances, notify_fn2).call(this);
  }
  mutate(variables, options) {
    var _a2;
    __privateSet(this, _mutateOptions, options);
    (_a2 = __privateGet(this, _currentMutation)) == null ? void 0 : _a2.removeObserver(this);
    __privateSet(this, _currentMutation, __privateGet(this, _client2).getMutationCache().build(__privateGet(this, _client2), this.options));
    __privateGet(this, _currentMutation).addObserver(this);
    return __privateGet(this, _currentMutation).execute(variables);
  }
}, _client2 = new WeakMap(), _currentResult2 = new WeakMap(), _currentMutation = new WeakMap(), _mutateOptions = new WeakMap(), _MutationObserver_instances = new WeakSet(), updateResult_fn = function() {
  var _a2;
  const state = ((_a2 = __privateGet(this, _currentMutation)) == null ? void 0 : _a2.state) ?? getDefaultState();
  __privateSet(this, _currentResult2, {
    ...state,
    isPending: state.status === "pending",
    isSuccess: state.status === "success",
    isError: state.status === "error",
    isIdle: state.status === "idle",
    mutate: this.mutate,
    reset: this.reset
  });
}, notify_fn2 = function(action) {
  notifyManager.batch(() => {
    var _a2, _b2, _c, _d, _e, _f, _g, _h;
    if (__privateGet(this, _mutateOptions) && this.hasListeners()) {
      const variables = __privateGet(this, _currentResult2).variables;
      const onMutateResult = __privateGet(this, _currentResult2).context;
      const context = {
        client: __privateGet(this, _client2),
        meta: this.options.meta,
        mutationKey: this.options.mutationKey
      };
      if ((action == null ? void 0 : action.type) === "success") {
        try {
          (_b2 = (_a2 = __privateGet(this, _mutateOptions)).onSuccess) == null ? void 0 : _b2.call(
            _a2,
            action.data,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
        try {
          (_d = (_c = __privateGet(this, _mutateOptions)).onSettled) == null ? void 0 : _d.call(
            _c,
            action.data,
            null,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
      } else if ((action == null ? void 0 : action.type) === "error") {
        try {
          (_f = (_e = __privateGet(this, _mutateOptions)).onError) == null ? void 0 : _f.call(
            _e,
            action.error,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
        try {
          (_h = (_g = __privateGet(this, _mutateOptions)).onSettled) == null ? void 0 : _h.call(
            _g,
            void 0,
            action.error,
            variables,
            onMutateResult,
            context
          );
        } catch (e) {
          void Promise.reject(e);
        }
      }
    }
    this.listeners.forEach((listener) => {
      listener(__privateGet(this, _currentResult2));
    });
  });
}, _b);
var IsRestoringContext = reactExports.createContext(false);
var useIsRestoring = () => reactExports.useContext(IsRestoringContext);
IsRestoringContext.Provider;
function createValue() {
  let isReset = false;
  return {
    clearReset: () => {
      isReset = false;
    },
    reset: () => {
      isReset = true;
    },
    isReset: () => {
      return isReset;
    }
  };
}
var QueryErrorResetBoundaryContext = reactExports.createContext(createValue());
var useQueryErrorResetBoundary = () => reactExports.useContext(QueryErrorResetBoundaryContext);
var ensurePreventErrorBoundaryRetry = (options, errorResetBoundary, query) => {
  const throwOnError = (query == null ? void 0 : query.state.error) && typeof options.throwOnError === "function" ? shouldThrowError(options.throwOnError, [query.state.error, query]) : options.throwOnError;
  if (options.suspense || options.experimental_prefetchInRender || throwOnError) {
    if (!errorResetBoundary.isReset()) {
      options.retryOnMount = false;
    }
  }
};
var useClearResetErrorBoundary = (errorResetBoundary) => {
  reactExports.useEffect(() => {
    errorResetBoundary.clearReset();
  }, [errorResetBoundary]);
};
var getHasError = ({
  result,
  errorResetBoundary,
  throwOnError,
  query,
  suspense
}) => {
  return result.isError && !errorResetBoundary.isReset() && !result.isFetching && query && (suspense && result.data === void 0 || shouldThrowError(throwOnError, [result.error, query]));
};
var ensureSuspenseTimers = (defaultedOptions) => {
  if (defaultedOptions.suspense) {
    const MIN_SUSPENSE_TIME_MS = 1e3;
    const clamp = (value) => value === "static" ? value : Math.max(value ?? MIN_SUSPENSE_TIME_MS, MIN_SUSPENSE_TIME_MS);
    const originalStaleTime = defaultedOptions.staleTime;
    defaultedOptions.staleTime = typeof originalStaleTime === "function" ? (...args) => clamp(originalStaleTime(...args)) : clamp(originalStaleTime);
    if (typeof defaultedOptions.gcTime === "number") {
      defaultedOptions.gcTime = Math.max(
        defaultedOptions.gcTime,
        MIN_SUSPENSE_TIME_MS
      );
    }
  }
};
var willFetch = (result, isRestoring) => result.isLoading && result.isFetching && !isRestoring;
var shouldSuspend = (defaultedOptions, result) => (defaultedOptions == null ? void 0 : defaultedOptions.suspense) && result.isPending;
var fetchOptimistic = (defaultedOptions, observer, errorResetBoundary) => observer.fetchOptimistic(defaultedOptions).catch(() => {
  errorResetBoundary.clearReset();
});
function useBaseQuery(options, Observer, queryClient) {
  var _a2, _b2, _c, _d;
  const isRestoring = useIsRestoring();
  const errorResetBoundary = useQueryErrorResetBoundary();
  const client = useQueryClient();
  const defaultedOptions = client.defaultQueryOptions(options);
  (_b2 = (_a2 = client.getDefaultOptions().queries) == null ? void 0 : _a2._experimental_beforeQuery) == null ? void 0 : _b2.call(
    _a2,
    defaultedOptions
  );
  const query = client.getQueryCache().get(defaultedOptions.queryHash);
  defaultedOptions._optimisticResults = isRestoring ? "isRestoring" : "optimistic";
  ensureSuspenseTimers(defaultedOptions);
  ensurePreventErrorBoundaryRetry(defaultedOptions, errorResetBoundary, query);
  useClearResetErrorBoundary(errorResetBoundary);
  const isNewCacheEntry = !client.getQueryCache().get(defaultedOptions.queryHash);
  const [observer] = reactExports.useState(
    () => new Observer(
      client,
      defaultedOptions
    )
  );
  const result = observer.getOptimisticResult(defaultedOptions);
  const shouldSubscribe = !isRestoring && options.subscribed !== false;
  reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => {
        const unsubscribe = shouldSubscribe ? observer.subscribe(notifyManager.batchCalls(onStoreChange)) : noop;
        observer.updateResult();
        return unsubscribe;
      },
      [observer, shouldSubscribe]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  reactExports.useEffect(() => {
    observer.setOptions(defaultedOptions);
  }, [defaultedOptions, observer]);
  if (shouldSuspend(defaultedOptions, result)) {
    throw fetchOptimistic(defaultedOptions, observer, errorResetBoundary);
  }
  if (getHasError({
    result,
    errorResetBoundary,
    throwOnError: defaultedOptions.throwOnError,
    query,
    suspense: defaultedOptions.suspense
  })) {
    throw result.error;
  }
  (_d = (_c = client.getDefaultOptions().queries) == null ? void 0 : _c._experimental_afterQuery) == null ? void 0 : _d.call(
    _c,
    defaultedOptions,
    result
  );
  if (defaultedOptions.experimental_prefetchInRender && !environmentManager.isServer() && willFetch(result, isRestoring)) {
    const promise = isNewCacheEntry ? (
      // Fetch immediately on render in order to ensure `.promise` is resolved even if the component is unmounted
      fetchOptimistic(defaultedOptions, observer, errorResetBoundary)
    ) : (
      // subscribe to the "cache promise" so that we can finalize the currentThenable once data comes in
      query == null ? void 0 : query.promise
    );
    promise == null ? void 0 : promise.catch(noop).finally(() => {
      observer.updateResult();
    });
  }
  return !defaultedOptions.notifyOnChangeProps ? observer.trackResult(result) : result;
}
function useQuery(options, queryClient) {
  return useBaseQuery(options, QueryObserver);
}
function useMutation(options, queryClient) {
  const client = useQueryClient();
  const [observer] = reactExports.useState(
    () => new MutationObserver(
      client,
      options
    )
  );
  reactExports.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = reactExports.useSyncExternalStore(
    reactExports.useCallback(
      (onStoreChange) => observer.subscribe(notifyManager.batchCalls(onStoreChange)),
      [observer]
    ),
    () => observer.getCurrentResult(),
    () => observer.getCurrentResult()
  );
  const mutate = reactExports.useCallback(
    (variables, mutateOptions) => {
      observer.mutate(variables, mutateOptions).catch(noop);
    },
    [observer]
  );
  if (result.error && shouldThrowError(observer.options.throwOnError, [result.error])) {
    throw result.error;
  }
  return { ...result, mutate, mutateAsync: result.mutate };
}
function hasAccessControl(actor) {
  return typeof actor === "object" && actor !== null && "_initializeAccessControl" in actor;
}
const ACTOR_QUERY_KEY = "actor";
function useActor(createActor2) {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const actorQuery = useQuery({
    queryKey: [ACTOR_QUERY_KEY, identity == null ? void 0 : identity.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;
      if (!isAuthenticated) {
        return await createActorWithConfig(createActor2);
      }
      const actorOptions = {
        agentOptions: {
          identity
        }
      };
      const actor = await createActorWithConfig(createActor2, actorOptions);
      if (hasAccessControl(actor)) {
        await actor._initializeAccessControl();
      }
      return actor;
    },
    // Only refetch when identity changes
    staleTime: Number.POSITIVE_INFINITY,
    // This will cause the actor to be recreated when the identity changes
    enabled: true
  });
  reactExports.useEffect(() => {
    if (actorQuery.data) {
      queryClient.invalidateQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
      queryClient.refetchQueries({
        predicate: (query) => {
          return !query.queryKey.includes(ACTOR_QUERY_KEY);
        }
      });
    }
  }, [actorQuery.data, queryClient]);
  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching
  };
}
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$8 = [
  ["path", { d: "M5 12h14", key: "1ays0h" }],
  ["path", { d: "m12 5 7 7-7 7", key: "xquz4c" }]
];
const ArrowRight = createLucideIcon("arrow-right", __iconNode$8);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$7 = [
  ["path", { d: "M12 7v14", key: "1akyts" }],
  [
    "path",
    {
      d: "M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z",
      key: "ruj8y"
    }
  ]
];
const BookOpen = createLucideIcon("book-open", __iconNode$7);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$6 = [["path", { d: "M20 6 9 17l-5-5", key: "1gmf2c" }]];
const Check = createLucideIcon("check", __iconNode$6);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$5 = [["path", { d: "m18 15-6-6-6 6", key: "153udz" }]];
const ChevronUp = createLucideIcon("chevron-up", __iconNode$5);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$4 = [
  ["rect", { width: "14", height: "14", x: "8", y: "8", rx: "2", ry: "2", key: "17jyea" }],
  ["path", { d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2", key: "zix9uf" }]
];
const Copy = createLucideIcon("copy", __iconNode$4);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$3 = [
  [
    "path",
    {
      d: "M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z",
      key: "1s6t7t"
    }
  ],
  ["circle", { cx: "16.5", cy: "7.5", r: ".5", fill: "currentColor", key: "w0ekpg" }]
];
const KeyRound = createLucideIcon("key-round", __iconNode$3);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$2 = [
  [
    "path",
    {
      d: "M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5",
      key: "1gvzjb"
    }
  ],
  ["path", { d: "M9 18h6", key: "x1upvd" }],
  ["path", { d: "M10 22h4", key: "ceow96" }]
];
const Lightbulb = createLucideIcon("lightbulb", __iconNode$2);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode$1 = [
  ["path", { d: "M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8", key: "v9h5vc" }],
  ["path", { d: "M21 3v5h-5", key: "1q7to0" }],
  ["path", { d: "M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16", key: "3uifl3" }],
  ["path", { d: "M8 16H3v5", key: "1cv678" }]
];
const RefreshCw = createLucideIcon("refresh-cw", __iconNode$1);
/**
 * @license lucide-react v0.511.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */
const __iconNode = [
  ["path", { d: "M3 6h18", key: "d0wm0j" }],
  ["path", { d: "M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6", key: "4alrt4" }],
  ["path", { d: "M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2", key: "v07s0e" }],
  ["line", { x1: "10", x2: "10", y1: "11", y2: "17", key: "1uufr5" }],
  ["line", { x1: "14", x2: "14", y1: "11", y2: "17", key: "xtxkd" }]
];
const Trash2 = createLucideIcon("trash-2", __iconNode);
const SAMPLE_CODES = [
  {
    language: "JavaScript",
    label: "JavaScript — Fetch User Data",
    code: `async function fetchUser(userId) {
  const response = await fetch(\`https://api.example.com/users/\${userId}\`);
  const data = response.json();  // Missing await!
  return data.name;
}

function processUsers(users) {
  var result = [];
  for (var i = 0; i <= users.length; i++) {  // Off-by-one error
    result.push(users[i].name.toUpperCase());
  }
  return result;
}

// Unused variable
const config = { timeout: 5000, retries: 3 };
fetchUser(42).then(name => console.log(name));
`
  },
  {
    language: "Python",
    label: "Python — Calculate Average",
    code: `def calculate_average(numbers):
    total = 0
    for number in numbers:
        total += number
    average = total / len(numbers)
    return average

# Test the function
data = [10, 20, 30, 40, 50]
print(calculate_average(data))
print(calculate_average([]))  # This will cause a ZeroDivisionError
`
  },
  {
    language: "Java",
    label: "Java — String Processor",
    code: `import java.util.ArrayList;
import java.util.List;

public class StringProcessor {
    private List<String> items = new ArrayList<>();

    public void addItem(String item) {
        items.add(item);  // No null check
    }

    public String getFirst() {
        return items.get(0);  // No bounds check
    }

    public int countOccurrences(String target) {
        int count = 0;
        for (int i = 0; i < items.size(); i++) {
            if (items.get(i) == target) {  // Should use .equals()
                count++;
            }
        }
        return count;
    }

    public static void main(String[] args) {
        StringProcessor sp = new StringProcessor();
        sp.addItem("hello");
        sp.addItem("world");
        System.out.println(sp.getFirst());
        System.out.println(sp.countOccurrences("hello"));
    }
}
`
  },
  {
    language: "TypeScript",
    label: "TypeScript — Generic Stack",
    code: `class Stack<T> {
  private items: T[] = [];

  push(item: T): void {
    this.items.push(item);
  }

  pop(): T {
    return this.items.pop()!; // No empty check — runtime error if empty
  }

  peek(): T {
    return this.items[this.items.length - 1]; // Returns undefined when empty
  }

  get size(): number {
    return this.items.length;
  }
}

const stack = new Stack<number>();
stack.push(1);
stack.push(2);
console.log(stack.pop());
console.log(stack.pop());
console.log(stack.pop()); // undefined — no guard
`
  },
  {
    language: "C++",
    label: "C++ — Linked List",
    code: `#include <iostream>

struct Node {
    int data;
    Node* next;
};

class LinkedList {
public:
    Node* head = nullptr;

    void insert(int val) {
        Node* newNode = new Node{val, head};
        head = newNode;
    }

    void print() {
        Node* curr = head;
        while (curr != nullptr) {
            std::cout << curr->data << " ";
            curr = curr->next;
        }
        std::cout << std::endl;
    }

    // Missing destructor — memory leak!
};

int main() {
    LinkedList list;
    list.insert(3);
    list.insert(2);
    list.insert(1);
    list.print();
    return 0;
}
`
  },
  {
    language: "C",
    label: "C — String Reverse",
    code: `#include <stdio.h>
#include <string.h>

void reverseString(char* str) {
    int n = strlen(str);
    for (int i = 0; i < n / 2; i++) {
        char temp = str[i];
        str[i] = str[n - i - 1];
        str[n - i - 1] = temp;
    }
}

int main() {
    char s[] = "hello world";
    reverseString(s);
    printf("%s\\n", s);

    // Potential buffer overflow — no bounds check
    char buf[5];
    gets(buf); // Unsafe: use fgets instead
    printf("%s\\n", buf);
    return 0;
}
`
  },
  {
    language: "C#",
    label: "C# — File Reader",
    code: `using System;
using System.IO;

class FileReader {
    public static string ReadFile(string path) {
        // No exception handling
        StreamReader reader = new StreamReader(path);
        string content = reader.ReadToEnd();
        reader.Close(); // Should use 'using' statement
        return content;
    }

    static void Main(string[] args) {
        string text = ReadFile("data.txt");
        Console.WriteLine(text.Substring(0, 100)); // May throw if file < 100 chars
    }
}
`
  },
  {
    language: "Go",
    label: "Go — HTTP Handler",
    code: `package main

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type User struct {
	Name  string \`json:"name"\`
	Email string \`json:"email"\`
}

func getUser(w http.ResponseWriter, r *http.Request) {
	user := User{Name: "Alice", Email: "alice@example.com"}
	data, _ := json.Marshal(user) // Ignoring error
	fmt.Fprintf(w, string(data))  // Should set Content-Type header
}

func main() {
	http.HandleFunc("/user", getUser)
	http.ListenAndServe(":8080", nil) // Ignoring error
}
`
  },
  {
    language: "Rust",
    label: "Rust — Vec Operations",
    code: `fn find_max(numbers: &Vec<i32>) -> i32 {
    let mut max = numbers[0]; // Panics on empty vec
    for &n in numbers.iter() {
        if n > max {
            max = n;
        }
    }
    max
}

fn double_values(numbers: Vec<i32>) -> Vec<i32> {
    let mut result = Vec::new();
    for n in numbers {
        result.push(n * 2);
    }
    result // Could use .iter().map(|&n| n * 2).collect()
}

fn main() {
    let nums = vec![3, 1, 4, 1, 5, 9, 2, 6];
    println!("Max: {}", find_max(&nums));
    println!("Doubled: {:?}", double_values(nums));
}
`
  },
  {
    language: "Kotlin",
    label: "Kotlin — Data Class",
    code: `data class Person(val name: String, val age: Int)

fun filterAdults(people: List<Person>): List<Person> {
    val result = mutableListOf<Person>()
    for (person in people) {
        if (person.age >= 18) {
            result.add(person)
        }
    }
    return result // Could use people.filter { it.age >= 18 }
}

fun main() {
    val people = listOf(
        Person("Alice", 25),
        Person("Bob", 16),
        Person("Charlie", 30),
        Person("Diana", 15)
    )
    val adults = filterAdults(people)
    adults.forEach { println(it.name) }
}
`
  },
  {
    language: "Swift",
    label: "Swift — Optionals",
    code: `import Foundation

struct User {
    let name: String
    let email: String?
}

func sendEmail(to user: User) {
    let email = user.email! // Force unwrap — crashes if nil
    print("Sending email to \\(email)")
}

func getUserAge(from dict: [String: Any]) -> Int {
    return dict["age"] as! Int // Force cast — risky
}

let alice = User(name: "Alice", email: nil)
sendEmail(to: alice) // Will crash!

let data: [String: Any] = ["name": "Bob", "age": "not a number"]
print(getUserAge(from: data)) // Will crash!
`
  },
  {
    language: "PHP",
    label: "PHP — Login Form",
    code: `<?php
$username = $_GET['username']; // Should use POST and sanitize
$password = $_GET['password'];

$conn = mysqli_connect("localhost", "root", "", "mydb");

// SQL Injection vulnerability!
$query = "SELECT * FROM users WHERE username = '$username' AND password = '$password'";
$result = mysqli_query($conn, $query);

if (mysqli_num_rows($result) > 0) {
    echo "Login successful";
} else {
    echo "Invalid credentials";
}

mysqli_close($conn);
?>
`
  },
  {
    language: "Ruby",
    label: "Ruby — Array Methods",
    code: `def find_duplicates(arr)
  duplicates = []
  arr.each_with_index do |item, i|
    arr.each_with_index do |other, j|
      if i != j && item == other && !duplicates.include?(item)
        duplicates << item
      end
    end
  end
  duplicates # O(n^3) — very inefficient
end

names = ["alice", "bob", "alice", "charlie", "bob", "dave"]
puts find_duplicates(names).inspect
`
  },
  {
    language: "Scala",
    label: "Scala — Factorial",
    code: `object MathUtils {
  def factorial(n: Int): Long = {
    if (n < 0) throw new IllegalArgumentException("Negative input")
    var result = 1L
    var i = 1
    while (i <= n) {
      result *= i
      i += 1
    }
    result // Could use tail-recursive approach
  }

  def main(args: Array[String]): Unit = {
    for (i <- 0 to 10) {
      println(s"$i! = \${factorial(i)}")
    }
    println(factorial(21)) // Overflows Long!
  }
}
`
  },
  {
    language: "Dart",
    label: "Dart — Counter Widget",
    code: `class Counter {
  int _count = 0;

  void increment() => _count++;
  void decrement() => _count--;

  int get value => _count;

  void reset() {
    _count = 0;
  }
}

void main() {
  final counter = Counter();
  counter.increment();
  counter.increment();
  counter.increment();
  counter.decrement();
  print('Count: \${counter.value}'); // Should be 2

  // No validation — can go negative infinitely
  for (int i = 0; i < 10; i++) {
    counter.decrement();
  }
  print('Count after decrement: \${counter.value}'); // -8
}
`
  },
  {
    language: "Haskell",
    label: "Haskell — List Utilities",
    code: `module ListUtils where

-- Safe head — returns Maybe
safeHead :: [a] -> Maybe a
safeHead [] = Nothing
safeHead (x:_) = Just x

-- Compute running sum
runningSum :: [Int] -> [Int]
runningSum [] = []
runningSum xs = scanl1 (+) xs

-- Remove consecutive duplicates
compress :: Eq a => [a] -> [a]
compress [] = []
compress [x] = [x]
compress (x:y:rest)
  | x == y    = compress (y:rest)
  | otherwise = x : compress (y:rest)

main :: IO ()
main = do
  print $ safeHead ([] :: [Int])
  print $ runningSum [1, 2, 3, 4, 5]
  print $ compress [1,1,2,3,3,3,4,4,5]
`
  },
  {
    language: "Lua",
    label: "Lua — Table Utils",
    code: `-- Map function over a table
function map(t, fn)
  local result = {}
  for i, v in ipairs(t) do
    result[i] = fn(v)
  end
  return result
end

-- Filter function
function filter(t, predicate)
  local result = {}
  for _, v in ipairs(t) do
    if predicate(v) then
      result[#result + 1] = v
    end
  end
  return result
end

local numbers = {1, 2, 3, 4, 5, 6, 7, 8}
local doubled = map(numbers, function(x) return x * 2 end)
local evens = filter(numbers, function(x) return x % 2 == 0 end)

-- No print utility — relies on manual loop
for _, v in ipairs(doubled) do io.write(v .. " ") end
print()
`
  },
  {
    language: "R",
    label: "R — Data Analysis",
    code: `# Load and summarise a simple dataset
scores <- c(85, 92, 78, 90, 88, 76, 95, 82, 89, 91)

mean_score <- mean(scores)
sd_score <- sd(scores)
median_score <- median(scores)

cat("Mean:", mean_score, "\\n")
cat("SD:", sd_score, "\\n")
cat("Median:", median_score, "\\n")

# Simple linear model — no validation
x <- 1:10
y <- 2 * x + rnorm(10, 0, 1)
model <- lm(y ~ x)
summary(model)

# Potential issue: no NA handling
scores_with_na <- c(scores, NA, NA)
cat("Mean with NA:", mean(scores_with_na), "\\n") # Returns NA
`
  },
  {
    language: "MATLAB",
    label: "MATLAB — Matrix Operations",
    code: `% Matrix operations example
A = [1 2 3; 4 5 6; 7 8 9];
b = [1; 2; 3];

% Solve Ax = b
% A is singular — this will warn or error
x = A \\ b;
disp(x);

% Eigenvalues
[V, D] = eig(A);
disp('Eigenvalues:');
disp(diag(D));

% Element-wise vs matrix multiply — common mistake
C = A * A;   % Matrix multiplication
D2 = A .* A; % Element-wise — intended?
disp(C - D2);
`
  },
  {
    language: "SQL",
    label: "SQL — Query Optimization",
    code: `-- Find top customers by total order value
SELECT
    c.customer_id,
    c.name,
    SUM(o.amount) AS total_spent
FROM customers c
JOIN orders o ON c.customer_id = o.customer_id
WHERE o.status = 'completed'
GROUP BY c.customer_id, c.name
HAVING SUM(o.amount) > 1000
ORDER BY total_spent DESC;

-- Potential N+1 issue: fetching order items separately
SELECT * FROM orders WHERE customer_id = 42;
SELECT * FROM order_items WHERE order_id = 1;
SELECT * FROM order_items WHERE order_id = 2;
-- Should JOIN order_items in one query instead
`
  }
];
function getSampleForLanguage(language) {
  const sample = SAMPLE_CODES.find((s) => s.language === language);
  return (sample == null ? void 0 : sample.code) ?? null;
}
const SUPPORTED_LANGUAGES = [
  "JavaScript",
  "Python",
  "TypeScript",
  "Java",
  "C",
  "C++",
  "C#",
  "Go",
  "Rust",
  "Kotlin",
  "Swift",
  "PHP",
  "Ruby",
  "Scala",
  "Dart",
  "Haskell",
  "Lua",
  "R",
  "MATLAB",
  "SQL"
];
const MAX_CODE_LENGTH$1 = 5e4;
function CodeEditor({
  code,
  language,
  onCodeChange,
  onLanguageChange,
  onSubmit,
  isLoading
}) {
  const textareaRef = reactExports.useRef(null);
  const lineCount = reactExports.useMemo(() => {
    const n = code.split("\n").length;
    return Math.max(n, 1);
  }, [code]);
  const lineNumbers = reactExports.useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1),
    [lineCount]
  );
  const isOverLimit = code.length > MAX_CODE_LENGTH$1;
  const charCount = code.length;
  const handleKeyDown = reactExports.useCallback(
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!isLoading && !isOverLimit && code.trim()) onSubmit();
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const next = `${code.substring(0, start)}  ${code.substring(end)}`;
        onCodeChange(next);
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [isLoading, isOverLimit, code, onCodeChange, onSubmit]
  );
  const handleChange = reactExports.useCallback(
    (e) => {
      onCodeChange(e.target.value);
    },
    [onCodeChange]
  );
  const handleClear = reactExports.useCallback(() => {
    var _a2;
    onCodeChange("");
    (_a2 = textareaRef.current) == null ? void 0 : _a2.focus();
  }, [onCodeChange]);
  const handleSample = reactExports.useCallback(() => {
    var _a2;
    const sample = getSampleForLanguage(language);
    onCodeChange(
      sample ?? `// ${language} sample
console.log("Hello, world!");`
    );
    (_a2 = textareaRef.current) == null ? void 0 : _a2.focus();
  }, [language, onCodeChange]);
  const handleLanguageChange = reactExports.useCallback(
    (e) => {
      onLanguageChange(e.target.value);
    },
    [onLanguageChange]
  );
  const isSubmitDisabled = !code.trim() || isLoading || isOverLimit;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-col h-full", "data-ocid": "code-editor", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 px-3 py-2 border-b border-border bg-card shrink-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("label", { htmlFor: "language-select", className: "sr-only", children: "Programming language" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "select",
          {
            id: "language-select",
            value: language,
            onChange: handleLanguageChange,
            className: "appearance-none pl-3 pr-8 py-1.5 rounded-md border border-input bg-muted/40 text-sm font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-ring transition-smooth cursor-pointer",
            "data-ocid": "language-select",
            "aria-label": "Select programming language",
            children: SUPPORTED_LANGUAGES.map((lang) => /* @__PURE__ */ jsxRuntimeExports.jsx("option", { value: lang, children: lang }, lang))
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          ChevronDown,
          {
            className: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground",
            "aria-hidden": "true"
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1" }),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: handleSample,
          className: "gap-1.5 text-xs h-7 px-2.5",
          "data-ocid": "sample-btn",
          "aria-label": `Load ${language} sample code`,
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-3.5 h-3.5", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Sample" })
          ]
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          onClick: handleClear,
          disabled: !code,
          className: "gap-1.5 text-xs h-7 px-2.5 text-muted-foreground hover:text-destructive",
          "data-ocid": "clear-btn",
          "aria-label": "Clear editor",
          children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Trash2, { className: "w-3.5 h-3.5", "aria-hidden": "true" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Clear" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex flex-1 overflow-auto min-h-0 bg-background", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "div",
        {
          className: "select-none shrink-0 pt-3 pb-3 text-right bg-card border-r border-border",
          "aria-hidden": "true",
          style: {
            minWidth: "3rem",
            paddingRight: "0.6rem",
            paddingLeft: "0.4rem"
          },
          children: lineNumbers.map((n) => /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: "font-mono text-xs text-muted-foreground/50 leading-relaxed",
              style: { lineHeight: "1.625rem" },
              children: n
            },
            `ln-${n}`
          ))
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "textarea",
        {
          ref: textareaRef,
          value: code,
          onChange: handleChange,
          onKeyDown: handleKeyDown,
          spellCheck: false,
          placeholder: `// Paste or type your ${language} code here…
// Press Ctrl+Enter to analyze`,
          className: "flex-1 resize-none border-none outline-none bg-transparent code-editor px-4 py-3 w-full placeholder:text-muted-foreground/30 caret-accent",
          style: { lineHeight: "1.625rem", minHeight: "100%" },
          "data-ocid": "code-textarea",
          "aria-label": "Code input",
          "aria-describedby": "editor-status"
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between px-3 py-2 border-t border-border bg-card shrink-0 gap-3", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            id: "editor-status",
            className: `text-xs font-mono ${isOverLimit ? "text-destructive font-semibold" : "text-muted-foreground/60"}`,
            "data-ocid": "char-count",
            children: [
              charCount.toLocaleString(),
              " chars · ",
              lineCount,
              " lines"
            ]
          }
        ),
        isOverLimit && /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "span",
          {
            className: "text-xs text-destructive font-body",
            role: "alert",
            "aria-live": "polite",
            children: [
              "Code exceeds ",
              MAX_CODE_LENGTH$1.toLocaleString(),
              " character limit"
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        Button,
        {
          onClick: onSubmit,
          disabled: isSubmitDisabled,
          className: "gap-2 h-8 px-4 text-sm font-display font-medium bg-primary text-primary-foreground hover:opacity-90 transition-smooth shrink-0",
          "data-ocid": "analyze-btn",
          "aria-label": isLoading ? "Analysis in progress" : isOverLimit ? "Code is too long to analyze" : "Analyze code (Ctrl+Enter)",
          children: isLoading ? /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "span",
              {
                className: "w-3.5 h-3.5 rounded-full border-2 border-current border-t-transparent animate-spin",
                "aria-hidden": "true"
              }
            ),
            "Analyzing…"
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "hidden sm:inline", children: "Analyze" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "sm:hidden", children: "Run" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("kbd", { className: "hidden sm:inline-flex items-center gap-0.5 text-[10px] font-mono opacity-60 bg-primary-foreground/10 px-1 rounded", children: "⌘↵" })
          ] })
        }
      )
    ] })
  ] });
}
function CategoryCard({
  title,
  icon,
  badge,
  copyText,
  defaultOpen = true,
  "data-ocid": ocid,
  children
}) {
  const [open, setOpen] = reactExports.useState(defaultOpen);
  const [copyState, setCopyState] = reactExports.useState(
    "idle"
  );
  const handleCopy = reactExports.useCallback(async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
      setCopyState("success");
    } catch {
      setCopyState("error");
    } finally {
      setTimeout(() => setCopyState("idle"), 2e3);
    }
  }, [copyText]);
  const handleToggle = reactExports.useCallback(() => setOpen((o) => !o), []);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "category-card", "data-ocid": ocid, children: [
    /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 min-w-0", children: [
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", "aria-hidden": "true", children: icon }),
      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "font-display font-semibold text-sm text-foreground flex-1 truncate", children: title }),
      badge && /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "shrink-0", children: badge }),
      copyText && /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleCopy,
          "aria-label": copyState === "success" ? "Copied!" : copyState === "error" ? "Copy failed — clipboard unavailable" : `Copy ${title} to clipboard`,
          title: copyState === "success" ? "Copied!" : copyState === "error" ? "Copy failed" : "Copy",
          className: "shrink-0 p-1 rounded text-muted-foreground hover:text-accent transition-smooth focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "data-ocid": `${ocid}-copy`,
          children: copyState === "success" ? /* @__PURE__ */ jsxRuntimeExports.jsx(Check, { className: "w-3.5 h-3.5 text-chart-4", "aria-hidden": "true" }) : copyState === "error" ? (
            // Show a subtle red X on failure instead of silently failing.
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              Copy,
              {
                className: "w-3.5 h-3.5 text-destructive",
                "aria-hidden": "true"
              }
            )
          ) : /* @__PURE__ */ jsxRuntimeExports.jsx(Copy, { className: "w-3.5 h-3.5", "aria-hidden": "true" })
        }
      ),
      /* @__PURE__ */ jsxRuntimeExports.jsx(
        "button",
        {
          type: "button",
          onClick: handleToggle,
          "aria-label": open ? `Collapse ${title}` : `Expand ${title}`,
          "aria-expanded": open,
          className: "shrink-0 p-1 rounded text-muted-foreground hover:text-foreground transition-smooth focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          "data-ocid": `${ocid}-toggle`,
          children: open ? /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronUp, { className: "w-3.5 h-3.5", "aria-hidden": "true" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(ChevronDown, { className: "w-3.5 h-3.5", "aria-hidden": "true" })
        }
      )
    ] }),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: `overflow-hidden transition-all duration-300 ease-in-out ${open ? "max-h-[9999px] opacity-100 mt-3" : "max-h-0 opacity-0"}`,
        "aria-hidden": !open,
        children
      }
    )
  ] });
}
function EmptyState() {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col items-center justify-center h-full min-h-[320px] gap-6 px-6 py-10",
      "data-ocid": "empty-state",
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative flex items-center justify-center w-20 h-20", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 rounded-2xl bg-accent/10 border border-accent/20" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Cpu, { className: "w-9 h-9 text-accent" })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2 max-w-xs", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("h2", { className: "font-display font-semibold text-lg text-foreground", children: "Ready to analyze your code" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-sm text-muted-foreground font-body leading-relaxed", children: "Paste your code in the editor, choose a language, then run the analysis." })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("ol", { className: "flex flex-col gap-2 w-full max-w-[220px]", children: [
          { step: "1", label: "Paste your code" },
          { step: "2", label: "Select language" },
          { step: "3", label: "Click Analyze" }
        ].map(({ step, label }, i) => /* @__PURE__ */ jsxRuntimeExports.jsxs("li", { className: "flex items-center gap-3", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "flex items-center justify-center w-6 h-6 rounded-full bg-accent/15 border border-accent/30 text-accent font-display text-xs font-semibold shrink-0", children: step }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm text-muted-foreground font-body", children: label }),
          i < 2 && /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowRight, { className: "w-3 h-3 text-muted-foreground/40 ml-auto shrink-0" })
        ] }, step)) }),
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-2 text-xs text-muted-foreground/60 font-mono bg-muted/30 border border-border px-3 py-1.5 rounded-md", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(CodeXml, { className: "w-3 h-3 shrink-0" }),
          /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "Tip: Use Ctrl+Enter to analyze" })
        ] })
      ]
    }
  );
}
function getScoreTheme(score) {
  if (score >= 85) {
    return {
      ring: "stroke-chart-4",
      text: "text-chart-4",
      bar: "quality-bar-success"
    };
  }
  if (score >= 70) {
    return {
      ring: "stroke-accent",
      text: "text-accent",
      bar: "bg-accent"
    };
  }
  if (score >= 50) {
    return {
      ring: "stroke-chart-5",
      text: "text-chart-5",
      bar: "quality-bar-warning"
    };
  }
  return {
    ring: "stroke-destructive",
    text: "text-destructive",
    bar: "quality-bar-danger"
  };
}
function getGradeLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  return "Poor";
}
const GRADE_BANDS = [
  {
    label: "Poor",
    range: "0–49",
    color: "bg-destructive/20 border-destructive/30 text-destructive",
    isActive: (s) => s < 50
  },
  {
    label: "Fair",
    range: "50–69",
    color: "bg-chart-5/20 border-chart-5/30 text-chart-5",
    isActive: (s) => s >= 50 && s < 70
  },
  {
    label: "Good",
    range: "70–84",
    color: "bg-accent/20 border-accent/30 text-accent",
    isActive: (s) => s >= 70 && s < 85
  },
  {
    label: "Excellent",
    range: "85–100",
    color: "bg-chart-4/20 border-chart-4/30 text-chart-4",
    isActive: (s) => s >= 85
  }
];
function QualityScore({ score }) {
  const safeScore = Math.min(100, Math.max(0, Math.round(score)));
  const { ring, text, bar } = getScoreTheme(safeScore);
  const gradeLabel = getGradeLabel(safeScore);
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - safeScore / 100 * circumference;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "flex flex-col gap-4",
      "data-ocid": "quality-score",
      "aria-label": `Quality score: ${safeScore} out of 100 — ${gradeLabel}`,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center gap-5", children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "relative shrink-0", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "svg",
              {
                width: "88",
                height: "88",
                viewBox: "0 0 88 88",
                className: "-rotate-90",
                "aria-hidden": "true",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "circle",
                    {
                      cx: "44",
                      cy: "44",
                      r: radius,
                      fill: "none",
                      strokeWidth: "6",
                      className: "stroke-muted/40"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "circle",
                    {
                      cx: "44",
                      cy: "44",
                      r: radius,
                      fill: "none",
                      strokeWidth: "6",
                      strokeDasharray: circumference,
                      strokeDashoffset: dashOffset,
                      strokeLinecap: "round",
                      className: `${ring} transition-all duration-700 ease-out`
                    }
                  )
                ]
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "absolute inset-0 flex flex-col items-center justify-center", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                "span",
                {
                  className: `font-display font-bold text-xl leading-none ${text}`,
                  children: safeScore
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-muted-foreground text-[9px] font-mono leading-none mt-0.5", children: "/100" })
            ] })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 min-w-0 space-y-2", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex items-center justify-between", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-sm font-body text-muted-foreground", children: "Overall score" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: `text-sm font-display font-semibold ${text}`, children: gradeLabel })
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "quality-indicator", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
              "div",
              {
                className: `h-full rounded-full transition-all duration-700 ease-out ${bar}`,
                style: { width: `${safeScore}%` }
              }
            ) }),
            /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex justify-between text-[10px] font-mono text-muted-foreground/50", children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "0" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "50" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "70" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "85" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("span", { children: "100" })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grid grid-cols-4 gap-1.5", children: GRADE_BANDS.map(({ label: gl, range, color, isActive }) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
          "div",
          {
            className: `px-1.5 py-1.5 rounded border text-center transition-smooth ${color} ${isActive(safeScore) ? "opacity-100 ring-1 ring-current/30" : "opacity-30"}`,
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[10px] font-display font-semibold leading-none", children: gl }),
              /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "text-[9px] font-mono opacity-70 mt-0.5", children: range })
            ]
          },
          gl
        )) })
      ]
    }
  );
}
const SEVERITY_VARIANTS = {
  critical: "bg-destructive/20 text-destructive border-destructive/30",
  high: "bg-destructive/20 text-destructive border-destructive/30",
  warning: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  medium: "bg-chart-5/20 text-chart-5 border-chart-5/30",
  info: "bg-accent/20 text-accent border-accent/30",
  low: "bg-accent/20 text-accent border-accent/30"
};
function SeverityBadge({ severity }) {
  const key = severity.toLowerCase();
  const cls = SEVERITY_VARIANTS[key] ?? SEVERITY_VARIANTS.info;
  const label = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();
  return /* @__PURE__ */ jsxRuntimeExports.jsx(
    "span",
    {
      className: `inline-flex items-center px-1.5 py-0.5 rounded border text-[10px] font-mono font-medium shrink-0 ${cls}`,
      children: label
    }
  );
}
function classifyErrorType(error) {
  const lower = error.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("wait")) {
    return {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Clock, { className: "w-6 h-6 text-chart-5", "aria-hidden": "true" }),
      heading: "Rate limit reached",
      message: "You've hit Google's free tier request limit (15 requests/min). Wait 1–2 minutes for the quota to reset, then try again.",
      isRateLimit: true
    };
  }
  if (lower.includes("api key") || lower.includes("key is temporarily") || lower.includes("api_key")) {
    return {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(KeyRound, { className: "w-6 h-6 text-chart-5", "aria-hidden": "true" }),
      heading: "Service temporarily unavailable",
      message: "The AI service is temporarily unavailable. Please try again shortly.",
      isRateLimit: false
    };
  }
  if (lower.includes("cycles") || lower.includes("processing resources")) {
    return {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Zap, { className: "w-6 h-6 text-chart-5", "aria-hidden": "true" }),
      heading: "Analysis needs more resources",
      message: "The analysis request needs more resources. Please try again.",
      isRateLimit: false
    };
  }
  if (lower.includes("ic0508") || lower.includes("canister") || lower.includes("stopped") || lower.includes("temporarily unavailable")) {
    return {
      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-6 h-6 text-chart-5", "aria-hidden": "true" }),
      heading: "Service temporarily offline",
      message: "The backend service is temporarily unavailable. Please try again in a moment.",
      isRateLimit: false
    };
  }
  return {
    icon: /* @__PURE__ */ jsxRuntimeExports.jsx(TriangleAlert, { className: "w-6 h-6 text-chart-5", "aria-hidden": "true" }),
    heading: "Analysis failed",
    message: "Something went wrong with the analysis. Please try again.",
    isRateLimit: false
  };
}
function SkeletonCard({ index }) {
  const widths = ["w-28", "w-32", "w-24", "w-36"];
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      className: "category-card animate-pulse space-y-2",
      "aria-hidden": "true",
      style: { animationDelay: `${index * 100}ms` },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          "div",
          {
            className: `h-4 ${widths[index % widths.length]} bg-muted/50 rounded`
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-full bg-muted/40 rounded" }),
        /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "h-3 w-3/4 bg-muted/30 rounded" })
      ]
    }
  );
}
function ReviewResults({ reviewState, onRetry }) {
  const { status, data, error } = reviewState;
  const resultsPanelRef = reactExports.useRef(null);
  reactExports.useEffect(() => {
    if (status === "success" && resultsPanelRef.current) {
      resultsPanelRef.current.focus({ preventScroll: false });
      resultsPanelRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }
  }, [status]);
  if (status === "loading") {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex flex-col gap-3 p-4",
        "data-ocid": "results-loading",
        "aria-label": "Analyzing code, please wait…",
        "aria-live": "polite",
        "aria-busy": "true",
        children: [0, 1, 2, 3].map((i) => /* @__PURE__ */ jsxRuntimeExports.jsx(SkeletonCard, { index: i }, i))
      }
    );
  }
  if (status === "error") {
    const { icon, heading, message, isRateLimit } = classifyErrorType(
      error ?? ""
    );
    return /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col items-center justify-center gap-5 h-full min-h-[280px] px-6 py-10",
        "data-ocid": "results-error",
        role: "alert",
        "aria-live": "assertive",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(
            "div",
            {
              className: `flex items-center justify-center w-14 h-14 rounded-xl border ${isRateLimit ? "bg-chart-5/10 border-chart-5/30" : "bg-muted/40 border-border"}`,
              children: icon
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "text-center space-y-2 max-w-[300px]", children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              "p",
              {
                className: `font-display font-semibold text-sm ${isRateLimit ? "text-chart-5" : "text-foreground"}`,
                children: heading
              }
            ),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-body leading-relaxed", children: message }),
            isRateLimit && /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-chart-5/70 font-mono bg-chart-5/10 border border-chart-5/20 rounded px-2 py-1 mt-1", children: "Google free tier: 15 requests / minute" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-[10px] text-muted-foreground/60 font-body pt-1", children: "Click “Try again” to retry your last analysis." })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              size: "sm",
              onClick: onRetry,
              className: `gap-2 ${isRateLimit ? "border-chart-5/40 text-chart-5 bg-chart-5/10 hover:bg-chart-5/20" : ""}`,
              variant: isRateLimit ? "outline" : "default",
              "data-ocid": "retry-btn",
              "aria-label": "Try again — retry the last analysis",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(RefreshCw, { className: "w-3.5 h-3.5", "aria-hidden": "true" }),
                "Try again"
              ]
            }
          )
        ]
      }
    );
  }
  if (status === "idle" || !data) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(EmptyState, {});
  }
  const score = Number(data.qualityScore);
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    "div",
    {
      ref: resultsPanelRef,
      className: "flex flex-col gap-3 p-4 animate-in fade-in slide-in-from-right-4 duration-500 outline-none",
      "data-ocid": "results-panel",
      tabIndex: -1,
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryCard,
          {
            title: "Bugs Found",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Bug$1, { className: "w-4 h-4 text-destructive", "aria-hidden": "true" }),
            badge: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono bg-destructive/15 text-destructive border border-destructive/25 px-1.5 py-0.5 rounded", children: data.bugs.length }),
            copyText: data.bugs.length > 0 ? data.bugs.map((b) => `[${b.severity}] ${b.message}`).join("\n") : void 0,
            "data-ocid": "card-bugs",
            children: data.bugs.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-chart-4 font-body", children: "✓ No bugs detected. Code looks clean!" }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex flex-col gap-2", "aria-label": "Detected bugs", children: data.bugs.map((bug, i) => (
              // Use index+severity+message fragment as key to avoid collisions
              // when two bugs share the same severity.
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                "li",
                {
                  className: "flex items-start gap-2",
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(SeverityBadge, { severity: bug.severity }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs text-muted-foreground font-body leading-relaxed min-w-0 break-words", children: bug.message })
                  ]
                },
                `bug-${i}-${bug.severity}`
              )
            )) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryCard,
          {
            title: "Improvements",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Lightbulb, { className: "w-4 h-4 text-chart-5", "aria-hidden": "true" }),
            badge: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono bg-chart-5/15 text-chart-5 border border-chart-5/25 px-1.5 py-0.5 rounded", children: data.improvements.length }),
            copyText: data.improvements.length > 0 ? data.improvements.join("\n") : void 0,
            "data-ocid": "card-improvements",
            children: data.improvements.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-body", children: "No improvements suggested." }) : /* @__PURE__ */ jsxRuntimeExports.jsx(
              "ul",
              {
                className: "flex flex-col gap-1.5",
                "aria-label": "Improvement suggestions",
                children: data.improvements.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
                  "li",
                  {
                    className: "flex items-start gap-2 text-xs text-muted-foreground font-body leading-relaxed",
                    children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(
                        "span",
                        {
                          className: "text-chart-5 mt-0.5 shrink-0",
                          "aria-hidden": "true",
                          children: "›"
                        }
                      ),
                      /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "break-words min-w-0", children: item })
                    ]
                  },
                  item
                ))
              }
            )
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryCard,
          {
            title: "Code Explanation",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(BookOpen, { className: "w-4 h-4 text-accent", "aria-hidden": "true" }),
            copyText: data.explanation || void 0,
            "data-ocid": "card-explanation",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-body leading-relaxed whitespace-pre-line break-words", children: data.explanation || "No explanation provided." })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryCard,
          {
            title: "Best Practices",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Shield, { className: "w-4 h-4 text-chart-4", "aria-hidden": "true" }),
            badge: /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-[10px] font-mono bg-chart-4/15 text-chart-4 border border-chart-4/25 px-1.5 py-0.5 rounded", children: data.bestPractices.length }),
            copyText: data.bestPractices.length > 0 ? data.bestPractices.join("\n") : void 0,
            "data-ocid": "card-best-practices",
            children: data.bestPractices.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx("p", { className: "text-xs text-muted-foreground font-body", children: "No best practice notes." }) : /* @__PURE__ */ jsxRuntimeExports.jsx("ul", { className: "flex flex-col gap-1.5", "aria-label": "Best practices", children: data.bestPractices.map((item) => /* @__PURE__ */ jsxRuntimeExports.jsxs(
              "li",
              {
                className: "flex items-start gap-2 text-xs text-muted-foreground font-body leading-relaxed",
                children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "text-chart-4 mt-0.5 shrink-0",
                      "aria-hidden": "true",
                      children: "✓"
                    }
                  ),
                  /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "break-words min-w-0", children: item })
                ]
              },
              item
            )) })
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          CategoryCard,
          {
            title: "Quality Score",
            icon: /* @__PURE__ */ jsxRuntimeExports.jsx(Star, { className: "w-4 h-4 text-chart-5", "aria-hidden": "true" }),
            defaultOpen: true,
            "data-ocid": "card-quality-score",
            children: /* @__PURE__ */ jsxRuntimeExports.jsx(QualityScore, { score })
          }
        )
      ]
    }
  );
}
const Bug = Record({ "message": Text, "severity": Text });
const CodeReview = Record({
  "bugs": Vec(Bug),
  "improvements": Vec(Text),
  "explanation": Text,
  "bestPractices": Vec(Text),
  "qualityScore": Nat
});
const HttpHeader = Record({ "value": Text, "name": Text });
const HttpRequestResult = Record({
  "status": Nat,
  "body": Vec(Nat8),
  "headers": Vec(HttpHeader)
});
const TransformArgs = Record({
  "context": Vec(Nat8),
  "response": HttpRequestResult
});
Service({
  "analyzeCode": Func(
    [Text, Text],
    [Variant({ "ok": CodeReview, "err": Text })],
    []
  ),
  "transform": Func([TransformArgs], [HttpRequestResult], ["query"])
});
const idlFactory = ({ IDL: IDL2 }) => {
  const Bug2 = IDL2.Record({ "message": IDL2.Text, "severity": IDL2.Text });
  const CodeReview2 = IDL2.Record({
    "bugs": IDL2.Vec(Bug2),
    "improvements": IDL2.Vec(IDL2.Text),
    "explanation": IDL2.Text,
    "bestPractices": IDL2.Vec(IDL2.Text),
    "qualityScore": IDL2.Nat
  });
  const HttpHeader2 = IDL2.Record({ "value": IDL2.Text, "name": IDL2.Text });
  const HttpRequestResult2 = IDL2.Record({
    "status": IDL2.Nat,
    "body": IDL2.Vec(IDL2.Nat8),
    "headers": IDL2.Vec(HttpHeader2)
  });
  const TransformArgs2 = IDL2.Record({
    "context": IDL2.Vec(IDL2.Nat8),
    "response": HttpRequestResult2
  });
  return IDL2.Service({
    "analyzeCode": IDL2.Func(
      [IDL2.Text, IDL2.Text],
      [IDL2.Variant({ "ok": CodeReview2, "err": IDL2.Text })],
      []
    ),
    "transform": IDL2.Func([TransformArgs2], [HttpRequestResult2], ["query"])
  });
};
class Backend {
  constructor(actor, _uploadFile, _downloadFile, processError) {
    this.actor = actor;
    this._uploadFile = _uploadFile;
    this._downloadFile = _downloadFile;
    this.processError = processError;
  }
  async analyzeCode(arg0, arg1) {
    if (this.processError) {
      try {
        const result = await this.actor.analyzeCode(arg0, arg1);
        return from_candid_variant_n1(this._uploadFile, this._downloadFile, result);
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.analyzeCode(arg0, arg1);
      return from_candid_variant_n1(this._uploadFile, this._downloadFile, result);
    }
  }
  async transform(arg0) {
    if (this.processError) {
      try {
        const result = await this.actor.transform(arg0);
        return result;
      } catch (e) {
        this.processError(e);
        throw new Error("unreachable");
      }
    } else {
      const result = await this.actor.transform(arg0);
      return result;
    }
  }
}
function from_candid_variant_n1(_uploadFile, _downloadFile, value) {
  return "ok" in value ? {
    __kind__: "ok",
    ok: value.ok
  } : "err" in value ? {
    __kind__: "err",
    err: value.err
  } : value;
}
function createActor(canisterId, _uploadFile, _downloadFile, options = {}) {
  const agent = options.agent || HttpAgent.createSync({
    ...options.agentOptions
  });
  if (options.agent && options.agentOptions) {
    console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
  }
  const actor = Actor.createActor(idlFactory, {
    agent,
    canisterId,
    ...options.actorOptions
  });
  return new Backend(actor, _uploadFile, _downloadFile, options.processError);
}
const MAX_CODE_LENGTH = 5e4;
function classifyError(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("429")) {
    return "Rate limit reached: you've hit Google's free tier limit (15 requests/min). Wait 1-2 minutes and try again.";
  }
  if (lower.includes("api key") || lower.includes("invalid_argument") || lower.includes("api_key_invalid") || lower.includes("400") && lower.includes("key") || lower.includes("401") || lower.includes("403")) {
    return "The AI service key is temporarily unavailable. Try again in a moment.";
  }
  if (lower.includes("cycles")) {
    return "Analysis failed due to insufficient processing resources. Try again.";
  }
  if (lower.includes("ic0508") || lower.includes("stopped")) {
    return "The backend service is temporarily unavailable. Try again in a moment.";
  }
  return raw || "An unexpected error occurred. Please try again.";
}
function useCodeReview() {
  const { actor, isFetching } = useActor(createActor);
  const isActorReady = !!actor && !isFetching;
  const mutation = useMutation({
    mutationFn: async ({ code, language }) => {
      if (!actor || isFetching) {
        return {
          status: "error",
          data: null,
          error: "The AI service is still initializing. Please wait a moment and try again."
        };
      }
      if (code.length > MAX_CODE_LENGTH) {
        return {
          status: "error",
          data: null,
          error: `Code is too long (${code.length.toLocaleString()} chars). Maximum is ${MAX_CODE_LENGTH.toLocaleString()} characters.`
        };
      }
      try {
        const result = await actor.analyzeCode(code, language);
        if (result.__kind__ === "ok") {
          return {
            status: "success",
            data: result.ok,
            error: null
          };
        }
        const rawErr = result.err ?? "";
        return {
          status: "error",
          data: null,
          error: classifyError(rawErr)
        };
      } catch (err) {
        const raw = err instanceof Error ? err.message : String(err);
        return {
          status: "error",
          data: null,
          error: classifyError(raw)
        };
      }
    }
  });
  const reviewState = (() => {
    if (mutation.isPending) {
      return { status: "loading", data: null, error: null };
    }
    if (mutation.isSuccess) {
      return mutation.data;
    }
    if (mutation.isError) {
      return {
        status: "error",
        data: null,
        error: mutation.error.message
      };
    }
    return { status: "idle", data: null, error: null };
  })();
  return {
    reviewState,
    analyze: mutation.mutate,
    reset: mutation.reset,
    isActorReady
  };
}
function ReviewPage() {
  const [code, setCode] = reactExports.useState("");
  const [language, setLanguage] = reactExports.useState(SUPPORTED_LANGUAGES[0]);
  const { reviewState, analyze, reset } = useCodeReview();
  const handleAnalyze = reactExports.useCallback(() => {
    if (!code.trim() || reviewState.status === "loading") return;
    analyze({ code, language });
  }, [code, language, analyze, reviewState.status]);
  const handleRetry = reactExports.useCallback(() => {
    reset();
    if (code.trim()) {
      setTimeout(() => analyze({ code, language }), 0);
    }
  }, [reset, code, language, analyze]);
  const handleLanguageChange = reactExports.useCallback((lang) => {
    setLanguage(lang);
  }, []);
  const isLoading = reviewState.status === "loading";
  return /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "flex-1 flex flex-col overflow-hidden min-h-0", children: /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { className: "flex-1 flex flex-col md:flex-row overflow-hidden min-h-0", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "flex flex-col md:w-[60%] border-b md:border-b-0 md:border-r border-border overflow-hidden",
        style: { minHeight: "45vh" },
        "data-ocid": "editor-panel",
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          CodeEditor,
          {
            code,
            language,
            onCodeChange: setCode,
            onLanguageChange: handleLanguageChange,
            onSubmit: handleAnalyze,
            isLoading
          }
        )
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsxs(
      "div",
      {
        className: "flex flex-col md:w-[40%] overflow-y-auto bg-background",
        style: { minHeight: "45vh" },
        "data-ocid": "results-panel-wrapper",
        children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(
            "div",
            {
              className: "flex items-center gap-2 px-4 py-2 border-b border-border bg-card shrink-0",
              "aria-live": "polite",
              children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx("span", { className: "text-xs font-mono text-muted-foreground uppercase tracking-wider", children: "Analysis Results" }),
                reviewState.status === "success" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-1 text-[10px] font-mono text-chart-4", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "w-1.5 h-1.5 rounded-full bg-chart-4",
                      "aria-hidden": "true"
                    }
                  ),
                  "Complete"
                ] }),
                reviewState.status === "loading" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-1 text-[10px] font-mono text-accent", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "w-1.5 h-1.5 rounded-full bg-accent animate-pulse",
                      "aria-hidden": "true"
                    }
                  ),
                  "Analyzing…"
                ] }),
                reviewState.status === "error" && /* @__PURE__ */ jsxRuntimeExports.jsxs("span", { className: "ml-auto flex items-center gap-1 text-[10px] font-mono text-destructive", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "span",
                    {
                      className: "w-1.5 h-1.5 rounded-full bg-destructive",
                      "aria-hidden": "true"
                    }
                  ),
                  "Failed"
                ] })
              ]
            }
          ),
          /* @__PURE__ */ jsxRuntimeExports.jsx(ReviewResults, { reviewState, onRetry: handleRetry })
        ]
      }
    )
  ] }) });
}
export {
  ReviewPage
};
