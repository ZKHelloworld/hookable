import Hookable from '../index.ts';

test('class methods invocation sequence(decorator)', () => {
  class Base extends Hookable {
    value = '';

    @Hookable.registInterceptHook('beforeMount')
    @Hookable.registInterceptHook('afterMount', false)
    mount() {
      this.value += 'Base>';
    }
  }

  class Child extends Base {
    mount() {
      super.mount();
      this.value += 'Child>';
    }
  }

  const child = new Child();
  child.addHook('beforeMount', function() { this.value += 'beforeMount>' });
  child.addHook('afterMount', function() { this.value += 'afterMount>' });

  child.mount();

  expect(child.value).toBe('beforeMount>Base>Child>afterMount>')
});

test('class methods invocation sequence(static api)', () => {
  class Base extends Hookable {
    value = '';

    mount() {
      this.value += 'Base>';
    }
  }

  class Child extends Base {
    mount() {
      super.mount();

      this.value += 'Child>';
    }
  }

  Hookable.registInterceptHookOnClass(Base, 'mount', 'beforeMount');
  Hookable.registInterceptHookOnClass(Base, 'mount', 'afterMount', false);

  const child = new Child();
  child.addHook('beforeMount', function() { this.value += 'beforeMount>' });
  child.addHook('afterMount', function() { this.value += 'afterMount>' });
  child.mount();

  expect(child.value).toBe('beforeMount>Base>Child>afterMount>')
});