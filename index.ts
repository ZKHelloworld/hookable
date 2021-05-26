/**
 * Provide hook ability for hierarchy class
 */

type PropType = string | number | symbol;

interface HookMap {
  [key: string]: {
    fn: Function;
    isOnce?: boolean;
  }[];
}

const HOOKS = Symbol("hooks");
const INTERCEPS = Symbol("intercepts");

export default class Hookable {
  // store all the hook functions
  // {
  //    'beforeMount': [fn1, fn2],
  // }
  private [HOOKS]: HookMap = {};

  constructor() {
    return this.intercept();
  }

  /**
   * intercept all methods invocation
   */
  private intercept() {
    return new Proxy(this, {
      get(target: any, prop: PropType, receiver: any) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== "function") {
          return value;
        }

        // get the intercept info
        const beforeHookKey = target.traverseInterceptHookKey(prop, "before");
        const afterHookKey = target.traverseInterceptHookKey(prop, "after");
        if (!beforeHookKey && !afterHookKey) {
          return value;
        }

        return function (...args) {
          if (beforeHookKey) {
            target.execHooks(beforeHookKey, ...args);
          }

          const result = value.apply(this, args);

          if (afterHookKey) {
            target.execHooks(afterHookKey, ...args);
          }

          return result;
        };
      },
    });
  }

  /**
   * decoration way to regist intercept hook for class methods invocation
   *
   * @param hookKey
   * @param isBefore
   */
  static registHook(hookKey: string, isBefore: boolean = true): Function {
    return function (classProto, prop, descriptor) {
      // eslint-disable-next-line no-prototype-builtins
      if (!classProto.hasOwnProperty(INTERCEPS)) {
        classProto[INTERCEPS] = {};
      }

      classProto[INTERCEPS][prop] = classProto[INTERCEPS][prop] || {};
      classProto[INTERCEPS][prop][isBefore ? "before" : "after"] = hookKey;
    };
  }

  /**
   * static api way to regist intercept hook for class methods invocation
   *
   * @param constructor
   * @param prop
   * @param hookKey
   * @param isBefore
   */
  static registHookOnClass(
    constructor: Function,
    prop: string,
    hookKey: string,
    isBefore: boolean = true
  ) {
    const classProto = constructor.prototype;
    // eslint-disable-next-line no-prototype-builtins
    if (!classProto.hasOwnProperty(INTERCEPS)) {
      classProto[INTERCEPS] = {};
    }

    classProto[INTERCEPS][prop] = classProto[INTERCEPS][prop] || {};
    classProto[INTERCEPS][prop][isBefore ? "before" : "after"] = hookKey;
  }

  /**
   * ButtonProto: {
   *   _intercepts: {
   *     mount: { before: 'beforeButtonMount' }
   *   },
   *   __proto__: {
   *     _intercepts: {
   *       mount: { before: 'beforeMount', after: 'afterMount' }
   *     }
   *   }
   * }
   *
   * traverseInterceptHookKey('mount', 'before') => 'beforeButtonMount'
   * traverseInterceptHookKey('mount', 'after') => 'afterMount'
   *
   * @param prop
   * @param type
   */
  public traverseInterceptHookKey(prop: PropType, type: string): string {
    if (!this || !Object.getPrototypeOf(this)) {
      return "";
    }

    let proto = Object.getPrototypeOf(this);
    while (proto !== null) {
      // non _intercepts in prototype chain
      if (!proto[INTERCEPS]) {
        return "";
      }

      if (!proto[INTERCEPS][prop] || !proto[INTERCEPS][prop][type]) {
        proto = Object.getPrototypeOf(proto) || null;
        continue;
      }

      return proto[INTERCEPS][prop][type];
    }

    return "";
  }

  /**
   * add single hook
   *
   * @param hookKey
   * @param fn
   */
  public addHook(hookKey: string, fn: Function): void {
    if (typeof fn !== "function") {
      throw new Error("fn is not a function");
    }

    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push({ fn });
  }

  /**
   * add mutex hook
   *
   * @param hookKey
   * @param fn
   */
  public addMutexHook(hookKey: string, fn: Function): void {
    this.deleteHooks(hookKey);
    this.addHook(hookKey, fn);
  }

  /**
   * add hooks
   *
   * @param hookKey
   * @param fns
   */
  public addHooks(hookKey: string, fns: Array<Function>): void {
    if (fns.some((fn) => typeof fn !== "function")) {
      throw new Error("fns have non function item");
    }

    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push(...fns.map((fn) => ({ fn })));
  }

  /**
   * TODO add once hook
   *
   * @param hookKey
   * @param fn
   */
  public addOnceHook(hookKey: string, fn: Function): void {
    if (typeof fn !== "function") {
      throw new Error("fn is not a function");
    }

    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push({ fn, isOnce: true });
  }

  /**
   * TOOD add once hooks
   *
   * @param hookKey
   * @param fns
   */
  public addOnceHooks(hookKey: string, fns: Array<Function>): void {
    if (fns.some((fn) => typeof fn !== "function")) {
      throw new Error("fns have non function item");
    }

    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push(...fns.map((fn) => ({ fn, isOnce: true })));
  }

  /**
   * TODO get hook function
   *
   * @param hookKey
   * @param index
   */
  public getHook(hookKey: string, index): Function {
    return () => {};
  }

  /**
   * delete single hook
   *
   * @param hookKey
   * @param fn
   */
  public deleteHook(hookKey: string, fn: Function): void {
    const hooks = this[HOOKS][hookKey];
    if (!hooks || !hooks.length) {
      return;
    }

    const index = hooks.findIndex((h) => h.fn === fn);
    if (index === -1) {
      return;
    }

    hooks.splice(index, 1);
    this[HOOKS][hookKey] = hooks;
  }

  /**
   * delete hooks
   *
   * @param hookKey
   */
  public deleteHooks(hookKey: string): void {
    delete this[HOOKS][hookKey];
  }

  /**
   * delete all hooks
   */
  public clearHooks(): void {
    this[HOOKS] = {};
  }

  /**
   * exec single hook
   *
   * @param hookKey
   * @param index
   * @param args
   */
  public execHook(hookKey: string, index: number, ...args: any): void {
    const hooks = this[HOOKS][hookKey];
    if (!hooks || !hooks.length || !hooks[index]) {
      return;
    }

    try {
      const hook = hooks[index];
      hook.fn.apply(this, args);

      if (hook.isOnce) {
        this.deleteHook(hookKey, hook.fn);
      }
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * exec hooks
   *
   * @param hookKey
   */
  public execHooks(hookKey: string, ...args: any): void {
    const hooks = this[HOOKS][hookKey];
    if (!hooks || !hooks.length) {
      return;
    }

    hooks.forEach((hook) => {
      try {
        hook.fn.apply(this, args);

        if (hook.isOnce) {
          this.deleteHook(hookKey, hook.fn);
        }
      } catch (e) {
        console.error(e);
      }
    });
  }
}
