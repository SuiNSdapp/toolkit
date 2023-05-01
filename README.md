# SuiNS TypeScript SDK

![test workflow](https://github.com/SuiNSdapp/toolkit/actions/workflows/e2e-test.yml/badge.svg)
[![npm](https://img.shields.io/npm/v/@suins/toolkit?&color=brightgreen)](https://www.npmjs.com/package/@suins/toolkit)

This is a lightweight SDK (1kB minified bundle size), providing utility classes and functions for applications to interact with on-chain `.sui` names registered from [Sui Name Service (suins.io)](https://suins.io).

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

Choose network type:

```typescript
export const suinsClient = new SuinsClient(provider, {
  networkType: 'testnet',
});
```

> **Note:** To ensure best performance, please make sure to create only one instance of the SuinsClient class in your application. Then, import the created `suinsClient` instance to use its functions.

Fetch a `SuiAddress` linked to a name:

```typescript
const address = await suinsClient.getAddress('suins.sui');
```

Fetch the default name of a `SuiAddress`:

```typescript
const defaultName = await suinsClient.getName(
  '0xc2f08b6490b87610629673e76bab7e821fe8589c7ea6e752ea5dac2a4d371b41',
);
```

Fetch a name object:

```typescript
const nameObject = await suinsClient.getNameObject('suins.sui');
```

Fetch a name object with its dynamic data:

```typescript
const nameObject = await suinsClient.getNameObject('suins.sui', {
  showAvatar: true,
  showContentHash: true,
});
```

## License

[Apache-2.0](https://github.com/SuiNSdapp/toolkit/blob/main/LICENSE)
