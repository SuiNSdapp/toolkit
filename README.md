# SuiNS TypeScript SDK

![test workflow](https://github.com/SuiNSdapp/toolkit/actions/workflows/e2e-test.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/@suins/toolkit?&color=brightgreen)](https://www.npmjs.com/package/@suins/toolkit)

This is a lightweight SDK (1kB minified bundle size), providing utility classes and functions for applications to interact with on-chain `.sui` and `.move` domains registered from [Sui Name Service (suins.io)](https://suins.io).

## Getting started

The SDK is published to [npm registry](https://www.npmjs.com/package/@suins/toolkit). To use it in your project:

```bash
$ npm install @suins/toolkit
```

You can also use yarn or pnpm.

## Examples

Create an instance of SuinsClient:

```typescript
import { JsonRpcProvider } from '@mysten/sui.js';
import { SuinsClient } from '@suins/toolkit';

const provider = new JsonRpcProvider();
export const suinsClient = new SuinsClient(provider);
```

> **Note:** To ensure best performance, please make sure to create only one instance of the SuinsClient class in your application. Then, import the created `suinsClient` instance to use its functions.

Fetch a `SuiAddress` linked to a domain:

```typescript
const address = await suinsClient.getAddress('suins.sui');
```

Fetch the default domain of a `SuiAddress`:

```typescript
const defaultDomain = await suinsClient.getAddress(
  '0x484f1024c91ad8c9824bf46a708e3529251b2bc3',
);
```

Fetch resolver data of a domain:

```typescript
const resolverData = await suinsClient.getResolverData('suins.sui');
```

## License

[MIT](https://github.com/SuiNSdapp/toolkit/blob/main/LICENSE.md)
