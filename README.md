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