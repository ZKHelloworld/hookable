import Hookable from "../index.ts";

test("class methods invocation sequence(decorator)", () => {
  class Base extends Hookable {
    value = "";

    @Hookable.registHook("beforeMount")
    @Hookable.registHook("afterMount", false)
    mount() {
      this.value += "Base>";
    }
  }

  class Child extends Base {
    mount() {
      super.mount();
      this.value += "Child>";
    }
  }

  const child = new Child();
  child.addHook("beforeMount", function () {
    this.value += "beforeMount>";
  });
  child.addHook("afterMount", function () {
    this.value += "afterMount>";
  });

  child.mount();

  expect(child.value).toBe("beforeMount>Base>Child>afterMount>");
});

test("class methods invocation sequence(static api)", () => {
  class Base extends Hookable {
    value = "";

    mount() {
      this.value += "Base>";
    }
  }

  class Child extends Base {
    mount() {
      super.mount();

      this.value += "Child>";
    }
  }

  Hookable.registHookOnClass(Base, "mount", "beforeMount");
  Hookable.registHookOnClass(Base, "mount", "afterMount", false);

  const child = new Child();
  child.addHook("beforeMount", function () {
    this.value += "beforeMount>";
  });
  child.addHook("afterMount", function () {
    this.value += "afterMount>";
  });
  child.mount();

  expect(child.value).toBe("beforeMount>Base>Child>afterMount>");
});

test("addOnceHook", () => {
  class Base extends Hookable {
    value = "";

    @Hookable.registHook("beforeMount")
    mount() {
      this.value += "mount>";
    }
  }

  const base = new Base();
  base.addOnceHook("beforeMount", function () {
    this.value += "beforeMounted>";
  });

  base.mount();
  base.mount();

  expect(base.value).toBe("beforeMounted>mount>mount>");
});
