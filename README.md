# Hookable

Provide hook ability for hierarchy class

# Example 1

```javascript
class Base extends Hookable {
  @Hookable.registBeforeHook('beforeMount')
  @Hookable.registBeforeHook('afterMount')
  mount() {
    console.log('base mount');
  }
}

class Child extends Base {
  mount() {
    super.mount();

    console.log('child mount');
  }
}

const c = new Child();
c.addHook('beforeMount', () => console.log('before mount'));
c.addHook('afterMount', () => console.log('before mount'));

c.mount();

// before mount
// base mount
// child mount
// after mount
```
