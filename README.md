# Hookable

Provide hook ability for hierarchy classes

# Example 1

```javascript
class Base extends Hookable {
  @Hookable.registHook("beforeMount")
  @Hookable.registHook("afterMount", false)
  mount() {
    console.log("base mount");
  }
}

class Child extends Base {
  mount() {
    super.mount();

    console.log("child mount");
  }
}

const c = new Child();
c.addHook("beforeMount", () => console.log("before mount"));
c.addHook("afterMount", () => console.log("after mount"));

c.mount();
// before mount
// base mount
// child mount
// after mount
```

# Example 2

```javascript
class Base extends Hookable {
  doSomething() {
    this.execHooks("beforeDoSomething", "stage-a");
    // do something
    this.execHooks("doingSomething", "stage-b");
    // continue
    this.execHooks("afterDoSomething", "stage-c");
  }
}

const b = new Base();
b.addHook("beforeDoSomething", (msg) =>
  console.log("before doSomething ", msg)
);
b.addHook("doingSomething", (msg) => console.log("doingSomething ", msg));
b.addHook("afterDoSomething", (msg) => console.log("after doSomething ", msg));

b.doSomething();
// before doSomething stage-a
// doingSomething stage-b
// after doSomething stage-c
```
