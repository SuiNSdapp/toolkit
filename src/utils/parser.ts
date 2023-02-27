import {
  GetObjectDataResponse,
  normalizeSuiAddress,
  SuiMoveObject,
  SuiObject,
} from '@mysten/sui.js';

import { ResolverData } from '../types';

export const parseObjectDataResponse = (response: GetObjectDataResponse) =>
  ((response.details as SuiObject).data as SuiMoveObject).fields.value.fields;

export const parseResolverContents = (
  contents: Array<SuiMoveObject>,
): ResolverData =>
  contents.reduce(
    (acc: ResolverData, c) => ({
      ...acc,
      [c.fields.key]:
        c.type.includes('Address') || c.fields.key === 'addr'
          ? normalizeSuiAddress(c.fields.value)
          : c.fields.value,
    }),
    {},
  ) as ResolverData;
