/**
 * Provide hook ability for hierarchy class
 */

type PropType = string | number | symbol;

const HOOKS = Symbol('hooks');
const INTERCEPS = Symbol('intercepts');

export default class Hookable {
  // store all the hook functions
  // {
  //    'beforeMount': [fn1, fn2],
  // }
  private [HOOKS]: object = {};

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
        if (typeof value !== 'function') {
          return value;
        }

        // get the intercept info
        const beforeHookKey = target.traverseInterceptHookKey(prop, 'before');
        const afterHookKey = target.traverseInterceptHookKey(prop, 'after');
        if (!beforeHookKey && !afterHookKey) {
          return value;
        }

        return function (...args) {
          if (beforeHookKey) {
            target.execHooks(beforeHookKey);
          }

          const result = value.apply(target, args);

          if (afterHookKey) {
            target.execHooks(afterHookKey);
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
  static registInterceptHook(
    hookKey: string,
    isBefore: boolean = true
  ): Function {
    return function (classProto, prop, descriptor) {
      if (!classProto.hasOwnProperty(INTERCEPS)) {
        classProto[INTERCEPS] = {};
      }

      classProto[INTERCEPS][prop] = classProto[INTERCEPS][prop] || {};
      classProto[INTERCEPS][prop][isBefore ? 'before' : 'after'] = hookKey;
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
  static registInterceptHookOnClass(
    constructor: Function,
    prop: string,
    hookKey: string,
    isBefore: boolean = true
  ) {
    const classProto = constructor.prototype;
    if (!classProto.hasOwnProperty(INTERCEPS)) {
      classProto[INTERCEPS] = {};
    }

    classProto[INTERCEPS][prop] = classProto[INTERCEPS][prop] || {};
    classProto[INTERCEPS][prop][isBefore ? 'before' : 'after'] = hookKey;
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
      return '';
    }

    let proto = Object.getPrototypeOf(this);
    while (proto !== null) {
      // non _intercepts in prototype chain
      if (!proto[INTERCEPS]) {
        return '';
      }

      if (!proto[INTERCEPS][prop] || !proto[INTERCEPS][prop][type]) {
        proto = Object.getPrototypeOf(proto) || null;
        continue;
      }

      return proto[INTERCEPS][prop][type];
    }

    return '';
  }

  /**
   * add single hook
   *
   * @param hookKey
   * @param fn
   */
  public addHook(hookKey: string, fn: Function): void {
    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push(fn);
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
    let hooks = this[HOOKS][hookKey];
    if (!hooks) {
      hooks = [];
      this[HOOKS][hookKey] = hooks;
    }

    hooks.push(...fns);
  }

  /**
   * TODO add once hook
   *
   * @param hookKey
   * @param fn
   */
  public addOnceHook(hookKey: string, fn: Function): void {}

  /**
   * TOOD add once hooks
   *
   * @param hookKey
   * @param fns
   */
  public addOnceHooks(hookKey: string, fns: Array<Function>): void {}

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

    const index = hooks.findIndex((h) => h === fn);
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
      hooks[index].apply(this, args);
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
        hook.apply(this, args);
      } catch (e) {
        console.error(e);
      }
    });
  }
}
