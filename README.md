```json
{
  "compilerOptions": {
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*", "src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

```
or
```json
{
  "references": [{ "path": "node_modules/@barfittc/vue-service-provider/tsconfig.json" }]
}
```


To use

In your main.
```ts
createApp(App)
	.use(addServiceProvider())
	.use(addServiceProviderConsumer())
	.mount('#app')
```

in your Vue Plugin, register your services

```ts
export class TestConsumerTwo {
	hello;
	constructor (hello:string) {
		this.hello = hello;
	}
}
export class TestConsumerOne {

	@service(TestConsumerTwo)
	test!: TestConsumerTwo;

	/** gets called after creation and injection */
	setup() {
		console.log(this.test.hello)
	};
}

export function addServiceProviderConsumer ():Plugin {
	return function(app:App){
		getRegistry(app)
			.AddSingleton(TestConsumerOne) // 1 instance ever created
			.AddTransiant(TestConsumerTwo, "world"); // new instance created every request, you can also pass arguments to the contructor
	}
}
```

inside your setup script
```ts
const one = getService(TestConsumerOne);
console.log(one.test.hello);
```