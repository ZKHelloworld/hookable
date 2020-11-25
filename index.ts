/**
 * Provide hook ability for hierarchy class
 */

export default class Hookable {
  // store all the hook functions
  // {
  //    "beforeMount": [fn1, fn2],
  // }
  private _hooks: object = {};

  constructor() {
    return this.intercept();
  }

  /**
   * intercept all methods invocation
   */
  private intercept() {
    return new Proxy(this, {
      get(target, prop, receiver: any) {
        const value = Reflect.get(target, prop, receiver);
        if (typeof value !== 'function') {
          return value;
        }

        // retrive the info injected by the @Hookable.registBeforeHook/@Hookable.registAfterHook
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
      }
    });
  }

  /**
   * regist before hook for class methods
   * @param hookKey
   */
  static registBeforeHook(hookKey: string): Function {
    return function (classProto, prop, descriptor) {
      if (!classProto.hasOwnProperty('_intercepts')) {
        classProto._intercepts = {};
      }

      classProto._intercepts[prop] = classProto._intercepts[prop] || {};
      classProto._intercepts[prop].before = hookKey;
    };
  }

  /**
   * regist after hook for class methods
   * @param hookKey
   */
  static registAfterHook(hookKey: string): Function {
    return function (classProto, prop, descriptor) {
      if (!classProto.hasOwnProperty('_intercepts')) {
        classProto._intercepts = {};
      }

      classProto._intercepts[prop] = classProto._intercepts[prop] || {};
      classProto._intercepts[prop].after = hookKey;
    };
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
  traverseInterceptHookKey(prop: string, type: string): string {
    if (!this || !this.__proto__) {
      return '';
    }

    let proto = this.__proto__;
    while (proto !== null) {
      // non _intercepts in prototype chain
      if (!proto._intercepts) {
        return '';
      }

      if (!proto._intercepts[prop] || !proto._intercepts[prop][type]) {
        proto = proto.__proto__ || null;
        continue;
      }

      return proto._intercepts[prop][type];
    }

    return '';
  }

  /**
   * add single hook
   *
   * @param hookKey
   * @param fn
   */
  addHook(hookKey: string, fn: Function): void {
    let hooks = this._hooks[hookKey];
    if (!hooks) {
      hooks = [];
      this._hooks[hookKey] = hooks;
    }

    hooks.push(fn);
  }

  /**
   * add mutex hook
   *
   * @param hookKey
   * @param fn
   */
  andMutexHook(hookKey: string, fn: Function): void {
    this.deleteHooks(hookKey);
    this.addHook(hookKey, fn);
  }

  /**
   * add hooks
   *
   * @param hookKey
   * @param fns
   */
  addHooks(hookKey: string, fns: Array<Function>): void {
    let hooks = this._hooks[hookKey];
    if (!hooks) {
      hooks = [];
      this._hooks[hookKey] = hooks;
    }

    hooks.push(...fns);
  }

  /**
   * TODO add once hook
   *
   * @param hookKey
   * @param fn
   */
  addOnceHook(hookKey: string, fn: Function): void { }

  /**
   * TOOD add once hooks
   *
   * @param hookKey
   * @param fns
   */
  addOnceHooks(hookKey: string, fns: Array<Function>): void { }

  /**
   *
   * @param hookKey
   * @param index
   */
  getHook(hookKey: string, index): Function {
    return () => { };
  }

  /**
   * delete single hook
   *
   * @param hookKey
   * @param fn
   */
  deleteHook(hookKey: string, fn: Function): void {
    const hooks = this._hooks[hookKey];
    if (!hooks || !hooks.length) {
      return;
    }

    const index = hooks.findIndex((h) => h === fn);
    if (index === -1) {
      return;
    }

    hooks.splice(index, 1);
    this._hooks[hookKey] = hooks;
  }

  /**
   * delete hooks
   *
   * @param hookKey
   */
  deleteHooks(hookKey: string): void {
    delete this._hooks[hookKey];
  }

  /**
   * delete all hooks
   */
  clearHooks(): void {
    this._hooks = {};
  }

  /**
   * exec single hook
   *
   * @param hookKey
   * @param index
   * @param args
   */
  execHook(hookKey: string, index: number, ...args: any): void {
    const hooks = this._hooks[hookKey];
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
  execHooks(hookKey: string, ...args: any): void {
    const hooks = this._hooks[hookKey];
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
